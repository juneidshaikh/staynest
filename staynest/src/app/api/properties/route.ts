import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, withOptionalAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createPropertySchema } from '@/lib/validators'
import { apiRateLimit } from '@/lib/rate-limit'

// GET /api/properties - list properties (for owner dashboard or admin)
async function getHandler(req: AuthenticatedRequest) {
  const limited = apiRateLimit(req)
  if (limited) return limited

  try {
    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)
    const sortBy = url.searchParams.get('sortBy') || 'popular'
    const status = url.searchParams.get('status')
    const ownerId = url.searchParams.get('ownerId')
    const isFeatured = url.searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    const where: any = { status: 'ACTIVE' }

    if (status && req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') {
      where.status = status
    }

    if (ownerId) {
      where.ownerId = ownerId
    }

    if (isFeatured) {
      where.isFeatured = true
    }

    // Owner can only see their own properties
    if (req.user?.role === 'OWNER') {
      where.ownerId = req.user.userId
      delete where.status // owners see all their own statuses
    }

    const orderMap: any = {
      popular: { totalBookings: 'desc' },
      rating: { averageRating: 'desc' },
      newest: { createdAt: 'desc' },
      price_asc: { basePrice: 'asc' },
      price_desc: { basePrice: 'desc' },
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: orderMap[sortBy] || { totalBookings: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          coverImage: true,
          images: true,
          propertyType: true,
          status: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
          basePrice: true,
          minPrice: true,
          gender: true,
          averageRating: true,
          totalReviews: true,
          isVerified: true,
          isInstantBook: true,
          noBrokerage: true,
          availableRooms: true,
          totalRooms: true,
          isFeatured: true,
          createdAt: true,
          amenities: { select: { name: true }, take: 6 },
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.property.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        properties: properties.map(p => ({
          ...p,
          amenities: p.amenities.map(a => a.name),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Properties list error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/properties - create new property
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const parsed = createPropertySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const data = parsed.data

    // Generate slug
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 80)
    
    const existing = await prisma.property.count({ where: { slug: { startsWith: baseSlug } } })
    const slug = existing > 0 ? `${baseSlug}-${Date.now()}` : baseSlug

    const property = await prisma.property.create({
      data: {
        ownerId: req.user.userId,
        name: data.name,
        slug,
        description: data.description,
        propertyType: data.propertyType,
        gender: data.gender || 'ANY',
        status: 'PENDING_REVIEW',
        address: data.address,
        city: data.city,
        state: data.state,
        country: 'India',
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
        landmark: data.landmark,
        coverImage: '',
        basePrice: data.basePrice,
        securityDeposit: data.securityDeposit || 0,
        mealPlan: data.mealPlan || 'NONE',
        mealPrice: data.mealPrice,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        minStayDays: data.minStayDays,
        noticePeriodDays: data.noticePeriodDays,
        rules: data.rules || [],
        isInstantBook: data.isInstantBook,
        noBrokerage: data.noBrokerage,
        electricityCharge: data.electricityCharge,
      },
    })

    // Update owner role if not already owner
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { role: 'OWNER' },
    })

    return NextResponse.json({ success: true, data: { property } }, { status: 201 })
  } catch (error) {
    console.error('Create property error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create property' }, { status: 500 })
  }
}

export const GET = withOptionalAuth(getHandler)
export const POST = withAuth(postHandler)
