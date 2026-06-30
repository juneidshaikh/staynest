import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, withOptionalAuth, AuthenticatedRequest } from '@/lib/auth/middleware'

// GET /api/properties/[id]
async function getHandler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { id } = ctx.params

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: 'ACTIVE',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true,
            createdAt: true,
            _count: { select: { properties: true } },
          },
        },
        rooms: {
          where: { isAvailable: true },
          orderBy: { pricePerMonth: 'asc' },
        },
        amenities: true,
        nearbyPlaces: { orderBy: { distance: 'asc' } },
        _count: {
          select: { reviews: true, bookings: true, wishlistItems: true },
        },
        offers: {
          where: {
            isActive: true,
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    // Check wishlist status
    let isWishlisted = false
    if (req.user?.userId) {
      const wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_propertyId_listName: {
            userId: req.user.userId,
            propertyId: property.id,
            listName: 'Saved',
          },
        },
      })
      isWishlisted = !!wishlistItem
    }

    // Track recently viewed
    if (req.user?.userId) {
      await prisma.recentlyViewed.upsert({
        where: {
          userId_propertyId: {
            userId: req.user.userId,
            propertyId: property.id,
          },
        },
        update: { viewedAt: new Date() },
        create: {
          userId: req.user.userId,
          propertyId: property.id,
        },
      }).catch(() => {}) // non-critical
    }

    // Increment view count
    await prisma.propertyAnalytics.upsert({
      where: {
        propertyId_date: {
          propertyId: property.id,
          date: new Date(new Date().toDateString()),
        },
      },
      update: { views: { increment: 1 } },
      create: {
        propertyId: property.id,
        date: new Date(new Date().toDateString()),
        views: 1,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: { property: { ...property, isWishlisted } },
    })
  } catch (error) {
    console.error('Get property error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch property' }, { status: 500 })
  }
}

// PUT /api/properties/[id]
async function putHandler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { id } = ctx.params
    const body = await req.json()

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    // Only owner or admin can update
    if (property.ownerId !== req.user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
        // Owners can't change status directly
        status: ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role) ? body.status : undefined,
      },
    })

    return NextResponse.json({ success: true, data: { property: updated } })
  } catch (error) {
    console.error('Update property error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update property' }, { status: 500 })
  }
}

// DELETE /api/properties/[id]
async function deleteHandler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { id } = ctx.params

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    if (property.ownerId !== req.user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await prisma.property.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })

    return NextResponse.json({ success: true, message: 'Property deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete property' }, { status: 500 })
  }
}

export const GET = withOptionalAuth(getHandler)
export const PUT = withAuth(putHandler)
export const DELETE = withAuth(deleteHandler)
