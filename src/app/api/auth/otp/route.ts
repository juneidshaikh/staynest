import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { otpRequestSchema } from '@/lib/validators'
import { sendEmail, getOtpEmailTemplate } from '@/lib/email'
import { authRateLimit } from '@/lib/rate-limit'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  const limited = authRateLimit(req)
  if (limited) return limited

  try {
    const body = await req.json()
    const parsed = otpRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    const { email, phone, purpose } = parsed.data

    // Check if too many OTPs sent recently
    const recentOtps = await prisma.otpCode.count({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) }, // last 10 min
      },
    })

    if (recentOtps >= 3) {
      return NextResponse.json({
        success: false,
        error: 'Too many OTP requests. Please wait 10 minutes.',
      }, { status: 429 })
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Find user if exists
    let userId: string | undefined
    if (email) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      userId = user?.id
    } else if (phone) {
      const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
      userId = user?.id
    }

    // For login/verify, user must exist
    if ((purpose === 'login' || purpose === 'verify_email' || purpose === 'verify_phone') && !userId) {
      return NextResponse.json({ success: false, error: 'No account found. Please sign up first.' }, { status: 404 })
    }

    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: {
        OR: [{ email: email || undefined }, { phone: phone || undefined }],
        purpose,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    })

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        userId,
        email,
        phone,
        code: otp,
        purpose,
        expiresAt,
      },
    })

    // Send OTP via email or SMS
    if (email) {
      const sent = await sendEmail({
        to: email,
        subject: `Your StayNest verification code: ${otp}`,
        html: getOtpEmailTemplate(otp, purpose),
      })

      if (!sent) {
        return NextResponse.json({ success: false, error: 'Failed to send OTP email' }, { status: 500 })
      }
    }

    if (phone) {
      // SMS via Twilio (placeholder - configure Twilio)
      // await sendSMS(phone, `Your StayNest OTP: ${otp}. Valid for 10 minutes.`)
      console.log(`SMS OTP for ${phone}: ${otp}`) // Dev only
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${email || phone}`,
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { _debug_otp: otp }),
    })
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 })
  }
}
