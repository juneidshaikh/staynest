import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value || req.cookies.get('refresh_token')?.value

    if (token) {
      await prisma.session.deleteMany({
        where: { OR: [{ token }, { refreshToken: token }] },
      }).catch(() => {})
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  } catch {
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 })
  }
}
