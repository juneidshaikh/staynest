import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRefreshToken, generateTokenPair } from '@/lib/auth/jwt'

// POST /api/auth/refresh
export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value || (await req.json().catch(() => ({}))).refreshToken

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'Refresh token required' }, { status: 401 })
    }

    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired refresh token' }, { status: 401 })
    }

    // Check session exists
    const session = await prisma.session.findUnique({ where: { refreshToken } })
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, phone: true, isActive: true, isBanned: true },
    })

    if (!user || !user.isActive || user.isBanned) {
      return NextResponse.json({ success: false, error: 'Account not active' }, { status: 403 })
    }

    const tokens = generateTokenPair({ userId: user.id, email: user.email || undefined, phone: user.phone || undefined, role: user.role })

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const response = NextResponse.json({ success: true, data: { accessToken: tokens.accessToken } })
    response.cookies.set('access_token', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 })
    response.cookies.set('refresh_token', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 })
    return response
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Token refresh failed' }, { status: 500 })
  }
}
