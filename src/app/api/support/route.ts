import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createSupportTicketSchema } from '@/lib/validators'

function generateTicketNumber(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}`
}

async function getHandler(req: AuthenticatedRequest) {
  try {
    const where: any = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role) ? {} : { userId: req.user.userId }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ success: true, data: { tickets } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const parsed = createSupportTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId: req.user.userId,
        ...parsed.data,
      },
    })

    return NextResponse.json({ success: true, data: { ticket } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
