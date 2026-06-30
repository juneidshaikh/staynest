import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `${process.env.NEXT_PUBLIC_APP_NAME} <${process.env.EMAIL_FROM}>`,
      ...options,
    })
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// Email Templates
export function getOtpEmailTemplate(otp: string, purpose: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF385C 0%, #FF6B35 100%); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .body { padding: 40px; }
    .otp-box { background: #f8f9fa; border: 2px dashed #FF385C; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #FF385C; }
    .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; color: #666; font-size: 12px; }
    .btn { background: linear-gradient(135deg, #FF385C 0%, #FF6B35 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 StayNest</h1>
    </div>
    <div class="body">
      <h2 style="color: #1a1a1a;">Your Verification Code</h2>
      <p style="color: #666; line-height: 1.6;">
        ${purpose === 'login' ? 'Use this OTP to log in to your account.' : 
          purpose === 'signup' ? 'Use this OTP to verify your email address.' :
          purpose === 'reset_password' ? 'Use this OTP to reset your password.' :
          'Here is your verification code:'}
      </p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
        <p style="color: #999; margin: 8px 0 0 0; font-size: 14px;">Valid for 10 minutes only</p>
      </div>
      <p style="color: #666;">If you didn't request this code, please ignore this email and your account will remain secure.</p>
    </div>
    <div class="footer">
      <p>© 2024 StayNest. All rights reserved.</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>`
}

export function getBookingConfirmationEmailTemplate(booking: {
  bookingNumber: string
  propertyName: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  totalAmount: number
  propertyAddress: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF385C 0%, #FF6B35 100%); padding: 40px; text-align: center; }
    .body { padding: 40px; }
    .details { background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
    .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color:white; margin:0;">✅ Booking Confirmed!</h1>
      <p style="color:rgba(255,255,255,0.9); margin:8px 0 0 0;">Booking #${booking.bookingNumber}</p>
    </div>
    <div class="body">
      <h2>Hi ${booking.guestName}!</h2>
      <p style="color:#666;">Your booking has been confirmed. Here are your booking details:</p>
      <div class="details">
        <h3 style="margin:0 0 16px 0;">${booking.propertyName}</h3>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <span style="background:#FF385C; color:white; padding:4px 12px; border-radius:20px; font-size:13px;">Check-in: ${booking.checkInDate}</span>
          <span style="background:#1a1a1a; color:white; padding:4px 12px; border-radius:20px; font-size:13px;">Check-out: ${booking.checkOutDate}</span>
        </div>
        <p style="color:#666; margin:0;"><strong>Address:</strong> ${booking.propertyAddress}</p>
        <p style="color:#FF385C; font-size:20px; font-weight:700; margin:12px 0 0 0;">Total: ₹${booking.totalAmount.toLocaleString()}</p>
      </div>
      <p style="color:#666;">Login to your StayNest account to view more details, download your invoice, or contact the property owner.</p>
    </div>
    <div class="footer">
      <p>© 2024 StayNest. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

export function getWelcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF385C 0%, #FF6B35 100%); padding: 60px 40px; text-align: center; }
    .body { padding: 40px; }
    .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; color: #666; font-size: 12px; }
    .btn { background: linear-gradient(135deg, #FF385C 0%, #FF6B35 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color:white; font-size:32px; margin:0;">Welcome to StayNest! 🏠</h1>
      <p style="color:rgba(255,255,255,0.9); margin:12px 0 0 0; font-size:16px;">Find your perfect home away from home</p>
    </div>
    <div class="body">
      <h2>Hi ${name}! 👋</h2>
      <p style="color:#666; line-height:1.7;">Welcome to StayNest — India's premier platform for PGs, Hostels, Co-living Spaces, and Student Accommodations. We're thrilled to have you on board!</p>
      <p style="color:#666; line-height:1.7;">With StayNest, you can:</p>
      <ul style="color:#666; line-height:2;">
        <li>🔍 Search thousands of verified PGs and hostels</li>
        <li>📍 Find properties near your college or workplace</li>
        <li>💳 Book instantly with secure payments</li>
        <li>⭐ Read and write genuine reviews</li>
        <li>📱 Manage everything from your phone</li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" class="btn">Start Exploring</a>
    </div>
    <div class="footer">
      <p>© 2024 StayNest. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
