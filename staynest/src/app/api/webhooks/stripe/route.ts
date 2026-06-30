import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyStripeWebhook } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: any
  try {
    event = verifyStripeWebhook(body, signature)
  } catch (err: any) {
    console.error('Stripe webhook verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { bookingId, userId } = paymentIntent.metadata

        const payment = await prisma.payment.findFirst({
          where: { gatewayOrderId: paymentIntent.id },
        })

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              gatewayPaymentId: paymentIntent.id,
              paidAt: new Date(),
              gatewayResponse: paymentIntent,
            },
          })
        }

        if (bookingId) {
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
          })

          if (userId) {
            await prisma.notification.create({
              data: {
                userId,
                type: 'PAYMENT_SUCCESS',
                title: 'Payment Successful!',
                body: `Payment confirmed for booking #${booking.bookingNumber}`,
                data: { bookingId, amount: paymentIntent.amount / 100 },
              },
            })
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const payment = await prisma.payment.findFirst({ where: { gatewayOrderId: paymentIntent.id } })

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              gatewayResponse: paymentIntent,
            },
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const payment = await prisma.payment.findFirst({ where: { gatewayPaymentId: charge.payment_intent } })

        if (payment) {
          const refundAmount = charge.amount_refunded / 100
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED', refundAmount, refundedAt: new Date() },
          })

          const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } })
          if (booking) {
            await prisma.notification.create({
              data: {
                userId: payment.userId,
                type: 'REFUND_PROCESSED',
                title: 'Refund Processed',
                body: `₹${refundAmount} refund processed for booking #${booking.bookingNumber}`,
                data: { bookingId: booking.id, refundAmount },
              },
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
