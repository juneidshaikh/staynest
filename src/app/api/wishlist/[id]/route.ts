import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'

async function deleteHandler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { id: propertyId } = ctx.params
    const url = new URL(req.url)
    const listName = url.searchParams.get('listName') || 'Saved'

    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.userId, propertyId, listName },
    })

    return NextResponse.json({ success: true, message: 'Removed from wishlist' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}

export const DELETE = withAuth(deleteHandler)
