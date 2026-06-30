import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, withOptionalAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createReviewSchema } from '@/lib/validators'

async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const propertyId = url.searchParams.get('propertyId')
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 50)
    const sortBy = url.searchParams.get('sortBy') || 'recent'
    const skip = (page - 1) * limit

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID required' }, { status: 400 })
    }

    const orderBy: any = sortBy === 'helpful'
      ? { helpfulCount: 'desc' }
      : sortBy === 'rating_high'
      ? { overallRating: 'desc' }
      : sortBy === 'rating_low'
      ? { overallRating: 'asc' }
      : { createdAt: 'desc' }

    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { propertyId, isApproved: true },
        orderBy,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { votes: true } },
        },
      }),
      prisma.review.count({ where: { propertyId, isApproved: true } }),
      prisma.review.aggregate({
        where: { propertyId, isApproved: true },
        _avg: {
          overallRating: true,
          cleanlinessRating: true,
          locationRating: true,
          valueRating: true,
          safetyRating: true,
          staffRating: true,
          amenitiesRating: true,
        },
        _count: true,
      }),
    ])

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['overallRating'],
      where: { propertyId, isApproved: true },
      _count: true,
    })

    // Get vote status for current user
    let reviewsWithVote = reviews
    if (req.user?.userId) {
      const votes = await prisma.reviewVote.findMany({
        where: {
          reviewId: { in: reviews.map(r => r.id) },
          userId: req.user.userId,
        },
      })
      const voteMap = new Map(votes.map(v => [v.reviewId, v.isHelpful]))
      reviewsWithVote = reviews.map(r => ({ ...r, userVote: voteMap.has(r.id) ? { isHelpful: voteMap.get(r.id)! } : undefined }))
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsWithVote,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        aggregate: aggregate._avg,
        ratingDistribution: Object.fromEntries(
          [1, 2, 3, 4, 5].map(r => [r, ratingDistribution.find(d => Math.round(d.overallRating) === r)?._count || 0])
        ),
      },
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const parsed = createReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { propertyId, bookingId, overallRating, ...rest } = parsed.data

    // Check property exists
    const property = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }

    // Check if user already reviewed this property
    const existingReview = await prisma.review.findFirst({
      where: { propertyId, userId: req.user.userId },
    })
    if (existingReview) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this property' }, { status: 409 })
    }

    // Verify booking if provided
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId, userId: req.user.userId, propertyId },
      })
      if (!booking || !['CHECKED_OUT', 'CONFIRMED'].includes(booking.status)) {
        return NextResponse.json({ success: false, error: 'Invalid booking reference' }, { status: 400 })
      }
    }

    const review = await prisma.review.create({
      data: {
        propertyId,
        userId: req.user.userId,
        bookingId: bookingId || null,
        overallRating,
        isVerified: !!bookingId,
        ...rest,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { votes: true } },
      },
    })

    // Recalculate property average rating
    const stats = await prisma.review.aggregate({
      where: { propertyId, isApproved: true },
      _avg: { overallRating: true },
      _count: true,
    })

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        averageRating: Number((stats._avg.overallRating || 0).toFixed(1)),
        totalReviews: stats._count,
      },
    })

    // Notify property owner
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'REVIEW_RECEIVED',
        title: 'New Review!',
        body: `Your property "${property.name}" received a ${overallRating}⭐ review`,
        data: { propertyId, reviewId: review.id },
      },
    })

    return NextResponse.json({ success: true, data: { review } }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 })
  }
}

export const GET = withOptionalAuth(getHandler)
export const POST = withAuth(postHandler)
