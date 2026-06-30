import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'

async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const withUserId = url.searchParams.get('with')

    if (!withUserId) {
      // Get conversation list
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: req.user.userId }, { receiverId: req.user.userId }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
          receiver: { select: { id: true, name: true, avatarUrl: true } },
        },
      })

      // Group by conversation partner
      const conversationsMap = new Map()
      messages.forEach(msg => {
        const partnerId = msg.senderId === req.user.userId ? msg.receiverId : msg.senderId
        if (!conversationsMap.has(partnerId)) {
          const partner = msg.senderId === req.user.userId ? msg.receiver : msg.sender
          conversationsMap.set(partnerId, { partner, lastMessage: msg, unreadCount: 0 })
        }
        if (msg.receiverId === req.user.userId && !msg.isRead) {
          conversationsMap.get(partnerId).unreadCount++
        }
      })

      return NextResponse.json({ success: true, data: { conversations: Array.from(conversationsMap.values()) } })
    }

    // Get conversation with specific user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: req.user.userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: withUserId, receiverId: req.user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ success: true, data: { messages } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const { receiverId, content, propertyId, bookingId, attachments } = await req.json()

    if (!receiverId || !content) {
      return NextResponse.json({ success: false, error: 'Receiver and content required' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.userId,
        receiverId,
        propertyId,
        bookingId,
        content,
        attachments: attachments || [],
      },
    })

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        body: content.slice(0, 100),
        data: { senderId: req.user.userId, messageId: message.id },
      },
    })

    return NextResponse.json({ success: true, data: { message } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
