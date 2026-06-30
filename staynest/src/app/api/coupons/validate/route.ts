import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'

async function postHandler(req: AuthenticatedRequest) {
  try {
    const { code, amount, propertyId } = await req.json()

    if (!code || !amount) {
      return NextResponse.json({ success: false, error: 'Code and amount required' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { lte: new Date() },
        validTo: { gte: new Date() },
      },
    })

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid or expired coupon' }, { status: 404 })
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 })
    }

    if (coupon.propertyId && coupon.propertyId !== propertyId) {
      return NextResponse.json({ success: false, error: 'Coupon not applicable to this property' }, { status: 400 })
    }

    if (coupon.minBookingAmount && amount < coupon.minBookingAmount) {
      return NextResponse.json({
        success: false,
        error: `Minimum booking amount of ₹${coupon.minBookingAmount} required`,
      }, { status: 400 })
    }

    // Check per-user usage limit
    const userUsage = await prisma.userCoupon.findUnique({
      where: { userId_couponId: { userId: req.user.userId, couponId: coupon.id } },
    })
    if (userUsage && userUsage.usedCount >= coupon.perUserLimit) {
      return NextResponse.json({ success: false, error: 'You have already used this coupon' }, { status: 400 })
    }

    let discount = 0
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.min(amount * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = Math.min(coupon.discountValue, amount)
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: { code: coupon.code, title: coupon.title, type: coupon.type },
        discount: Math.round(discount),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to validate coupon' }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)
