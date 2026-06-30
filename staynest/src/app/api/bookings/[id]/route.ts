import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { cancelBookingSchema } from '@/lib/validators'

async function getHandler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { id } = ctx.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true, name: true, coverImage: true, address: true, city: true,
            state: true, latitude: true, longitude: true, checkInTime: true, checkOutTime: true,
            owner: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          },
        },
        room: true,
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        payments: true,
        coupon: { select: { code: true, title: true, discountValue: true, type: true } },
        review: { select: { id: true, overallRating: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Only the guest, property owner, or admin can view
    const isGuest = booking.userId === req.user.userId
    const isPropertyOwner = booking.property.owner.id === req.user.userId
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)

    if (!isGuest && !isPropertyOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: { booking } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
  }
}

async function patchHandler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { id } = ctx.params
    const body = await req.json()

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: { select: { ownerId: true, name: true } },
        payments: { where: { status: 'COMPLETED' } },
      },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Handle cancellation
    if (body.action === 'cancel') {
      const parsed = cancelBookingSchema.safeParse({ bookingId: id, reason: body.reason })
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Cancellation reason required' }, { status: 400 })
      }

      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        return NextResponse.json({ success: false, error: 'Booking cannot be cancelled in its current state' }, { status: 400 })
      }

      const isGuest = booking.userId === req.user.userId
      const isOwner = booking.property.ownerId === req.user.userId
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)

      if (!isGuest && !isOwner && !isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      // Calculate refund (simplified: 100% if > 7 days before check-in, 50% otherwise)
      const daysUntilCheckIn = Math.ceil((booking.checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const refundPercentage = daysUntilCheckIn > 7 ? 100 : daysUntilCheckIn > 3 ? 50 : 0
      const paidAmount = booking.payments.reduce((sum, p) => sum + p.amount, 0)
      const refundAmount = paidAmount * (refundPercentage / 100)

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: body.reason,
        },
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          body: `Your booking at ${booking.property.name} has been cancelled. ${refundPercentage > 0 ? `Refund of ₹${refundAmount} will be processed.` : 'No refund applicable.'}`,
          data: { bookingId: id, refundAmount },
        },
      })

      return NextResponse.json({
        success: true,
        data: { booking: updated, refundAmount, refundPercentage },
      })
    }

    // Handle status updates (admin/owner only)
    if (body.action === 'update_status') {
      const isOwner = booking.property.ownerId === req.user.userId
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: body.status,
          ...(body.status === 'CONFIRMED' && { confirmedAt: new Date() }),
          ...(body.status === 'CHECKED_IN' && { checkedInAt: new Date() }),
          ...(body.status === 'CHECKED_OUT' && { checkedOutAt: new Date() }),
        },
      })

      return NextResponse.json({ success: true, data: { booking: updated } })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Booking update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const PATCH = withAuth(patchHandler)
