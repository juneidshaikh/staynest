import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { verifyRazorpaySignature } from '@/lib/payments'

async function postHandler(req: AuthenticatedRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return NextResponse.json({ success: false, error: 'Missing payment verification data' }, { status: 400 })
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 })
    }

    // Find and update payment record
    const payment = await prisma.payment.findFirst({
      where: { bookingId, gatewayOrderId: razorpay_order_id },
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    })

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        paymentId: payment.id,
        type: 'debit',
        amount: payment.amount,
        balance: 0,
        description: `Payment for booking #${booking.bookingNumber}`,
        reference: razorpay_payment_id,
      },
    })

    // Notification
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful!',
        body: `₹${payment.amount} paid for booking #${booking.bookingNumber}`,
        data: { bookingId, paymentId: payment.id, amount: payment.amount },
      },
    })

    return NextResponse.json({ success: true, data: { booking, payment: { ...payment, status: 'COMPLETED' } } })
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)
