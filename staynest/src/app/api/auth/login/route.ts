import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { loginSchema } from '@/lib/validators'
import { generateTokenPair } from '@/lib/auth/jwt'
import { authRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const limited = authRateLimit(req)
  if (limited) return limited

  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 })
    }

    const { email, phone, password, otp } = parsed.data

    // Find user
    let user = null
    if (email) {
      user = await prisma.user.findUnique({ where: { email } })
    } else if (phone) {
      user = await prisma.user.findUnique({ where: { phone } })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with these credentials' }, { status: 404 })
    }

    if (!user.isActive || user.isBanned) {
      return NextResponse.json({ success: false, error: 'Account is suspended. Contact support.' }, { status: 403 })
    }

    // OTP Login
    if (otp) {
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          OR: [
            { email: email || undefined },
            { phone: phone || undefined },
          ],
          code: otp,
          purpose: 'login',
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!otpRecord) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 401 })
      }

      // Mark OTP as used
      await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } })

      // Auto-verify email/phone
      if (email && !user.emailVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
      }
      if (phone && !user.phoneVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } })
      }
    } else if (password) {
      // Password Login
      if (!user.passwordHash) {
        return NextResponse.json({ success: false, error: 'This account uses social login. Please use Google or OTP.' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ success: false, error: 'Password or OTP required' }, { status: 400 })
    }

    // Generate tokens
    const tokens = generateTokenPair({ userId: user.id, email: user.email || undefined, phone: user.phone || undefined, role: user.role })

    // Save session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    })

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    })

    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    })
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}
