import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'

async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
    const skip = (page - 1) * limit

    const where: any = { userId: req.user.userId }
    if (unreadOnly) where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data: { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

async function patchHandler(req: AuthenticatedRequest) {
  try {
    const { notificationIds, markAllRead } = await req.json()

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: req.user.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
    } else if (notificationIds?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: req.user.userId },
        data: { isRead: true, readAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update notifications' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const PATCH = withAuth(patchHandler)
