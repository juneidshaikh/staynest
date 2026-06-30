import Razorpay from 'razorpay'
import Stripe from 'stripe'
import crypto from 'crypto'

// Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// ====== Razorpay Functions ======

export async function createRazorpayOrder(amount: number, currency = 'INR', receipt: string) {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt,
    payment_capture: true,
  })
  return order
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex')
  return expectedSignature === signature
}

export async function createRazorpayRefund(paymentId: string, amount: number) {
  return await razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    speed: 'normal',
  })
}

// ====== Stripe Functions ======

export async function createStripePaymentIntent(
  amount: number,
  currency = 'inr',
  metadata: Record<string, string> = {}
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  })
  return paymentIntent
}

export async function createStripeRefund(paymentIntentId: string, amount?: number) {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount: Math.round(amount * 100) }),
  })
}

export function verifyStripeWebhook(payload: string, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// ====== Price Calculation ======

export interface PriceCalculation {
  baseAmount: number
  nights: number
  pricePerNight: number
  discountAmount: number
  couponDiscount: number
  platformFeeRate: number
  platformFee: number
  gstRate: number
  gst: number
  totalAmount: number
  securityDeposit: number
}

export function calculateBookingPrice(params: {
  pricePerMonth: number
  checkInDate: Date
  checkOutDate: Date
  discountPercentage?: number
  couponDiscount?: number
  securityDeposit?: number
}): PriceCalculation {
  const { pricePerMonth, checkInDate, checkOutDate, discountPercentage = 0, couponDiscount = 0, securityDeposit = 0 } = params
  
  const msPerDay = 24 * 60 * 60 * 1000
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay)
  const pricePerNight = pricePerMonth / 30
  
  const baseAmount = pricePerNight * nights
  const discountAmount = baseAmount * (discountPercentage / 100)
  const afterDiscount = baseAmount - discountAmount - couponDiscount
  
  const platformFeeRate = Number(process.env.PLATFORM_FEE_PERCENTAGE || 3) / 100
  const platformFee = afterDiscount * platformFeeRate
  
  const gstRate = Number(process.env.GST_PERCENTAGE || 18) / 100
  const gst = platformFee * gstRate
  
  const totalAmount = afterDiscount + platformFee + gst + securityDeposit

  return {
    baseAmount,
    nights,
    pricePerNight,
    discountAmount,
    couponDiscount,
    platformFeeRate,
    platformFee,
    gstRate,
    gst,
    totalAmount,
    securityDeposit,
  }
}

export function generateBookingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `SN-${timestamp}-${random}`
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 900000) + 100000
  return `INV-${year}-${random}`
}
