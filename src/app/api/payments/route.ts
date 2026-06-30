import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createRazorpayOrder, createStripePaymentIntent } from '@/lib/payments'

async function postHandler(req: AuthenticatedRequest) {
  try {
    const { bookingId, method } = await req.json()

    if (!bookingId || !method) {
      return NextResponse.json({ success: false, error: 'Booking ID and payment method required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: { select: { name: true } } },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId !== req.user.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Booking is cancelled' }, { status: 400 })
    }

    // Check if already fully paid
    const existingPayments = await prisma.payment.findMany({
      where: { bookingId, status: 'COMPLETED' },
    })
    const paidAmount = existingPayments.reduce((s, p) => s + p.amount, 0)
    const remaining = booking.totalAmount - paidAmount

    if (remaining <= 0) {
      return NextResponse.json({ success: false, error: 'Booking is already fully paid' }, { status: 400 })
    }

    let gatewayData: any = {}

    if (method === 'RAZORPAY' || method === 'UPI' || method === 'GOOGLE_PAY' || method === 'PHONEPE' || method === 'PAYTM' || method === 'NET_BANKING') {
      const order = await createRazorpayOrder(
        remaining,
        'INR',
        `SNBK-${booking.bookingNumber}`
      )
      gatewayData = {
        gateway: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        prefill: {
          name: booking.guestName,
          email: booking.guestEmail,
          contact: booking.guestPhone,
        },
        notes: {
          bookingId,
          bookingNumber: booking.bookingNumber,
        },
      }

      // Create pending payment record
      await prisma.payment.create({
        data: {
          bookingId,
          userId: req.user.userId,
          amount: remaining,
          currency: 'INR',
          status: 'PENDING',
          method: method as any,
          gatewayOrderId: order.id,
        },
      })
    } else if (method === 'STRIPE' || method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
      const intent = await createStripePaymentIntent(remaining, 'inr', {
        bookingId,
        bookingNumber: booking.bookingNumber,
        userId: req.user.userId,
        propertyName: booking.property.name,
      })

      gatewayData = {
        gateway: 'stripe',
        clientSecret: intent.client_secret,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        amount: remaining,
      }

      await prisma.payment.create({
        data: {
          bookingId,
          userId: req.user.userId,
          amount: remaining,
          currency: 'INR',
          status: 'PENDING',
          method: method as any,
          gatewayOrderId: intent.id,
        },
      })
    } else if (method === 'WALLET') {
      // Wallet payment
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { walletBalance: true },
      })

      if (!user || user.walletBalance < remaining) {
        return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
      }

      // Deduct from wallet
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { walletBalance: { decrement: remaining } },
      })

      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId: req.user.userId,
          amount: remaining,
          currency: 'INR',
          status: 'COMPLETED',
          method: 'WALLET',
          paidAt: new Date(),
        },
      })

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: req.user.userId,
          paymentId: payment.id,
          type: 'debit',
          amount: remaining,
          balance: user.walletBalance - remaining,
          description: `Payment for booking #${booking.bookingNumber}`,
          reference: booking.bookingNumber,
        },
      })

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      })

      return NextResponse.json({
        success: true,
        data: { gateway: 'wallet', payment, message: 'Payment successful' },
      })
    }

    return NextResponse.json({ success: true, data: gatewayData })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ success: false, error: 'Failed to initiate payment' }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)
