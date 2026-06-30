import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createBookingSchema } from '@/lib/validators'
import { calculateBookingPrice, generateBookingNumber, generateInvoiceNumber } from '@/lib/payments'
import { sendEmail, getBookingConfirmationEmailTemplate } from '@/lib/email'
import { format } from 'date-fns'

async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 50)
    const status = url.searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = {}

    if (req.user.role === 'GUEST' || req.user.role === 'OWNER') {
      where.userId = req.user.userId
    }

    if (req.user.role === 'OWNER') {
      // Owners see bookings for their properties
      const properties = await prisma.property.findMany({
        where: { ownerId: req.user.userId },
        select: { id: true },
      })
      where.propertyId = { in: properties.map(p => p.id) }
      delete where.userId
    }

    if (status) where.status = status

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          property: {
            select: { id: true, name: true, coverImage: true, address: true, city: true },
          },
          room: true,
          payments: { select: { id: true, amount: true, status: true, method: true, paidAt: true } },
          user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { bookings, total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const parsed = createBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    const {
      propertyId, roomId, checkInDate, checkOutDate,
      guestsCount, guestName, guestEmail, guestPhone,
      specialRequests, couponCode, paymentMethod,
    } = parsed.data

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId, status: 'ACTIVE' },
      include: { rooms: roomId ? { where: { id: roomId } } : false },
    })

    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found or not available' }, { status: 404 })
    }

    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)

    if (checkIn >= checkOut) {
      return NextResponse.json({ success: false, error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Check room availability
    if (roomId) {
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          roomId,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
          OR: [
            { checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn } },
          ],
        },
      })
      if (conflictingBooking) {
        return NextResponse.json({ success: false, error: 'Room is not available for the selected dates' }, { status: 409 })
      }
    }

    // Validate coupon
    let coupon = null
    let couponDiscount = 0
    if (couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() },
        },
      })

      if (coupon && coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 })
      }

      if (!coupon) {
        return NextResponse.json({ success: false, error: 'Invalid or expired coupon code' }, { status: 400 })
      }

      // Check per-user limit
      const userCouponUsage = await prisma.userCoupon.findUnique({
        where: { userId_couponId: { userId: req.user.userId, couponId: coupon.id } },
      })
      if (userCouponUsage && userCouponUsage.usedCount >= coupon.perUserLimit) {
        return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 })
      }
    }

    // Calculate price
    const priceCalc = calculateBookingPrice({
      pricePerMonth: property.basePrice,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      securityDeposit: property.securityDeposit,
    })

    // Apply coupon discount
    if (coupon) {
      if (coupon.type === 'PERCENTAGE') {
        couponDiscount = Math.min(
          priceCalc.baseAmount * (coupon.discountValue / 100),
          coupon.maxDiscount || Infinity
        )
      } else if (coupon.type === 'FIXED_AMOUNT') {
        couponDiscount = Math.min(coupon.discountValue, priceCalc.baseAmount)
      }

      if (coupon.minBookingAmount && priceCalc.baseAmount < coupon.minBookingAmount) {
        return NextResponse.json({
          success: false,
          error: `Minimum booking amount of ₹${coupon.minBookingAmount} required for this coupon`,
        }, { status: 400 })
      }
    }

    const totalAmount = priceCalc.totalAmount - couponDiscount
    const bookingNumber = generateBookingNumber()
    const invoiceNumber = generateInvoiceNumber()

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        invoiceNumber,
        userId: req.user.userId,
        propertyId,
        roomId: roomId || null,
        status: property.isInstantBook ? 'CONFIRMED' : 'PENDING',
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalDays: priceCalc.nights,
        guestsCount,
        baseAmount: priceCalc.baseAmount,
        discountAmount: priceCalc.discountAmount,
        couponDiscount,
        taxAmount: priceCalc.gst + priceCalc.platformFee,
        totalAmount,
        securityDeposit: priceCalc.securityDeposit,
        couponId: coupon?.id || null,
        couponCode: coupon?.code || null,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        confirmedAt: property.isInstantBook ? new Date() : null,
      },
      include: {
        property: { select: { id: true, name: true, coverImage: true, address: true, city: true } },
        room: true,
      },
    })

    // Update coupon usage
    if (coupon) {
      await Promise.all([
        prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } }),
        prisma.userCoupon.upsert({
          where: { userId_couponId: { userId: req.user.userId, couponId: coupon.id } },
          update: { usedCount: { increment: 1 } },
          create: { userId: req.user.userId, couponId: coupon.id, usedCount: 1 },
        }),
      ])
    }

    // Update property stats
    await prisma.property.update({
      where: { id: propertyId },
      data: { totalBookings: { increment: 1 } },
    })

    // Send confirmation email
    sendEmail({
      to: guestEmail,
      subject: `Booking Confirmed – ${booking.bookingNumber}`,
      html: getBookingConfirmationEmailTemplate({
        bookingNumber: booking.bookingNumber,
        propertyName: booking.property.name,
        guestName,
        checkInDate: format(checkIn, 'PPP'),
        checkOutDate: format(checkOut, 'PPP'),
        totalAmount,
        propertyAddress: `${booking.property.address}, ${booking.property.city}`,
      }),
    }).catch(console.error)

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed!',
        body: `Your booking at ${property.name} is confirmed. Booking #${bookingNumber}`,
        data: { bookingId: booking.id, bookingNumber },
      },
    })

    return NextResponse.json({ success: true, data: { booking } }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
