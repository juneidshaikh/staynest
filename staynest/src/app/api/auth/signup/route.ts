import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signupSchema } from '@/lib/validators'
import { generateTokenPair } from '@/lib/auth/jwt'
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email'
import { authRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const limited = authRateLimit(req)
  if (limited) return limited

  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    const { name, email, phone, password, gender } = parsed.data

    // Check if user already exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 })
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } })
      if (existingPhone) {
        return NextResponse.json({ success: false, error: 'An account with this phone number already exists' }, { status: 409 })
      }
    }

    // Hash password
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined

    // Generate referral code
    const referralCode = `SN${crypto.randomBytes(5).toString('hex').toUpperCase()}`

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        gender: gender as any,
        referralCode,
        emailVerified: false,
        phoneVerified: false,
      },
    })

    // Handle referral
    if (body.referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: body.referralCode } })
      if (referrer) {
        await prisma.user.update({ where: { id: user.id }, data: { referredBy: referrer.id } })
        // Award referral bonus
        await prisma.referralProgram.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
            referralCode: body.referralCode,
          },
        })
      }
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

    // Send welcome email (non-blocking)
    if (email) {
      sendEmail({
        to: email,
        subject: 'Welcome to StayNest! 🏠',
        html: getWelcomeEmailTemplate(name),
      }).catch(console.error)
    }

    // Set cookies
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
    }, { status: 201 })

    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    })
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 })
  }
}
