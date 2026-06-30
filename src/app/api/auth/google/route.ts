import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateTokenPair } from '@/lib/auth/jwt'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Google token required' }, { status: 400 })
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.sub || !payload?.email) {
      return NextResponse.json({ success: false, error: 'Invalid Google token' }, { status: 401 })
    }

    const { sub: googleId, email, name, picture } = payload

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    })

    if (!user) {
      // New user
      const nanoid = (await import('crypto')).randomBytes(5).toString('hex').toUpperCase()
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name: name || email.split('@')[0],
          avatarUrl: picture,
          emailVerified: true,
          referralCode: `SN${nanoid}`,
        },
      })
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerified: true, avatarUrl: picture || user.avatarUrl },
        })
      }
    }

    if (!user.isActive || user.isBanned) {
      return NextResponse.json({ success: false, error: 'Account is suspended' }, { status: 403 })
    }

    const tokens = generateTokenPair({ userId: user.id, email: user.email || undefined, role: user.role })

    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, emailVerified: user.emailVerified, phoneVerified: user.phoneVerified },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    })

    response.cookies.set('access_token', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 })
    response.cookies.set('refresh_token', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 })

    return response
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ success: false, error: 'Google authentication failed' }, { status: 500 })
  }
}
