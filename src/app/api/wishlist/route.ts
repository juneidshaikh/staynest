import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'

async function getHandler(req: AuthenticatedRequest) {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true, name: true, slug: true, coverImage: true, images: true,
            propertyType: true, city: true, state: true, latitude: true, longitude: true,
            basePrice: true, minPrice: true, gender: true, averageRating: true,
            totalReviews: true, isVerified: true, isInstantBook: true, noBrokerage: true,
            availableRooms: true, status: true,
            amenities: { select: { name: true }, take: 6 },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        wishlist: wishlist.map(item => ({
          ...item,
          property: {
            ...item.property,
            amenities: item.property.amenities.map(a => a.name),
            isWishlisted: true,
          },
        })),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const { propertyId, listName = 'Saved', notes } = await req.json()

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID required' }, { status: 400 })
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } })
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_propertyId_listName: {
          userId: req.user.userId,
          propertyId,
          listName,
        },
      },
      update: { notes },
      create: {
        userId: req.user.userId,
        propertyId,
        listName,
        notes,
      },
    })

    return NextResponse.json({ success: true, data: { item } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
