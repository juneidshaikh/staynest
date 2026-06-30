import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { searchSchema } from '@/lib/validators'
import { withOptionalAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'

async function handler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const rawParams: Record<string, string> = {}
    url.searchParams.forEach((value, key) => { rawParams[key] = value })

    // Handle array params
    const propertyTypes = url.searchParams.getAll('propertyType')
    const roomTypes = url.searchParams.getAll('roomType')
    const amenities = url.searchParams.getAll('amenities')

    const parsed = searchSchema.safeParse({
      ...rawParams,
      propertyType: propertyTypes.length ? propertyTypes[0] : rawParams.propertyType,
    })

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid search parameters', errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const {
      query, city, state, latitude, longitude, radius = 10,
      gender, minPrice, maxPrice, isVerified, isInstantBook, noBrokerage,
      minRating, sortBy = 'popular', page = 1, limit = 18,
    } = parsed.data

    const skip = (page - 1) * limit

    // Build WHERE clause
    const where: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ]
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (state) {
      where.state = { contains: state, mode: 'insensitive' }
    }

    if (propertyTypes.length > 0) {
      where.propertyType = { in: propertyTypes as any }
    }

    if (gender) {
      where.gender = { in: [gender as any, 'ANY'] }
    }

    if (minPrice || maxPrice) {
      where.basePrice = {}
      if (minPrice) where.basePrice.gte = minPrice
      if (maxPrice) where.basePrice.lte = maxPrice
    }

    if (isVerified) where.isVerified = true
    if (isInstantBook) where.isInstantBook = true
    if (noBrokerage) where.noBrokerage = true

    if (minRating) {
      where.averageRating = { gte: minRating }
    }

    // Amenity filtering
    if (amenities.length > 0) {
      where.amenities = {
        some: {
          name: { in: amenities },
        },
      }
    }

    // Room type filter
    if (roomTypes.length > 0) {
      where.rooms = {
        some: {
          roomType: { in: roomTypes as any },
          isAvailable: true,
        },
      }
    }

    // Build ORDER BY
    let orderBy: Prisma.PropertyOrderByWithRelationInput = {}
    switch (sortBy) {
      case 'price_asc': orderBy = { basePrice: 'asc' }; break
      case 'price_desc': orderBy = { basePrice: 'desc' }; break
      case 'rating': orderBy = { averageRating: 'desc' }; break
      case 'newest': orderBy = { createdAt: 'desc' }; break
      case 'popular': orderBy = { totalBookings: 'desc' }; break
      default: orderBy = { totalBookings: 'desc' }
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          coverImage: true,
          images: true,
          propertyType: true,
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
          amenities: {
            select: { name: true },
            take: 10,
          },
        },
      }),
      prisma.property.count({ where }),
    ])

    // Get wishlist status for authenticated users
    let wishlistIds: Set<string> = new Set()
    if (req.user?.userId) {
      const wishlistItems = await prisma.wishlistItem.findMany({
        where: {
          userId: req.user.userId,
          propertyId: { in: properties.map(p => p.id) },
        },
        select: { propertyId: true },
      })
      wishlistIds = new Set(wishlistItems.map(w => w.propertyId))
    }

    // Calculate distance if lat/lng provided
    const enriched = properties.map(p => {
      let distanceKm: number | undefined
      if (latitude && longitude) {
        const R = 6371
        const dLat = ((p.latitude - latitude) * Math.PI) / 180
        const dLon = ((p.longitude - longitude) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((p.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distanceKm = Math.round(R * c * 10) / 10
      }

      return {
        ...p,
        amenities: p.amenities.map(a => a.name),
        isWishlisted: wishlistIds.has(p.id),
        distanceKm,
      }
    })

    // Sort by distance if requested
    if (sortBy === 'distance' && latitude && longitude) {
      enriched.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999))
    }

    // Filter by radius if lat/lng provided
    const filtered = latitude && longitude
      ? enriched.filter(p => !p.distanceKm || p.distanceKm <= radius)
      : enriched

    return NextResponse.json({
      success: true,
      data: {
        properties: filtered,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 })
  }
}

export const GET = withOptionalAuth(handler)
