import { z } from 'zod'

// ======== Auth Schemas ========

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ANY']).optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
})

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, 'Password is required').optional(),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
})

export const otpRequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  purpose: z.enum(['login', 'signup', 'reset_password', 'verify_email', 'verify_phone']),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
})

export const resetPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  otp: z.string().length(6),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ======== Property Schemas ========

export const createPropertySchema = z.object({
  name: z.string().min(5).max(200),
  description: z.string().min(50).max(5000),
  propertyType: z.enum(['PG', 'HOSTEL', 'CO_LIVING', 'STUDENT_ACCOMMODATION']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ANY']),
  address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  landmark: z.string().optional(),
  basePrice: z.number().min(500).max(200000),
  securityDeposit: z.number().min(0).optional(),
  mealPlan: z.enum(['NONE', 'BREAKFAST', 'HALF_BOARD', 'FULL_BOARD']).default('NONE'),
  mealPrice: z.number().optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/),
  minStayDays: z.number().min(1).max(365).default(30),
  noticePeriodDays: z.number().min(0).max(90).default(30),
  rules: z.array(z.string()).optional(),
  isInstantBook: z.boolean().default(false),
  noBrokerage: z.boolean().default(false),
  electricityCharge: z.string().optional(),
})

export const createRoomSchema = z.object({
  name: z.string().min(2).max(100),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY', 'STUDIO', 'PRIVATE_ROOM']),
  capacity: z.number().min(1).max(20),
  totalBeds: z.number().min(1).max(20),
  floor: z.number().optional(),
  size: z.number().optional(),
  pricePerMonth: z.number().min(500),
  pricePerDay: z.number().optional(),
  description: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ANY']).default('ANY'),
  amenities: z.array(z.string()).optional(),
})

// ======== Booking Schemas ========

export const createBookingSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().optional(),
  checkInDate: z.string().datetime(),
  checkOutDate: z.string().datetime(),
  guestsCount: z.number().min(1).max(10),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  specialRequests: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['STRIPE', 'RAZORPAY', 'UPI', 'GOOGLE_PAY', 'PHONEPE', 'PAYTM', 'NET_BANKING', 'DEBIT_CARD', 'CREDIT_CARD', 'WALLET', 'CASH']),
})

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().min(5).max(500),
})

// ======== Review Schemas ========

export const createReviewSchema = z.object({
  propertyId: z.string().min(1),
  bookingId: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  cleanlinessRating: z.number().min(1).max(5).optional(),
  locationRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  safetyRating: z.number().min(1).max(5).optional(),
  staffRating: z.number().min(1).max(5).optional(),
  amenitiesRating: z.number().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  content: z.string().min(20).max(2000),
  images: z.array(z.string().url()).max(10).optional(),
})

// ======== Search Schemas ========

export const searchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().min(0.5).max(50).optional(),
  propertyType: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ANY']).optional(),
  roomType: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(1000000).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  guests: z.coerce.number().min(1).max(20).optional(),
  amenities: z.string().optional(),
  isVerified: z.coerce.boolean().optional(),
  isInstantBook: z.coerce.boolean().optional(),
  noBrokerage: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'popular', 'newest', 'distance', 'discount']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// ======== User Schemas ========

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ANY']).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  preferredLanguage: z.string().optional(),
  preferredCurrency: z.string().optional(),
})

// ======== Support Schemas ========

export const createSupportTicketSchema = z.object({
  subject: z.string().min(10).max(200),
  description: z.string().min(20).max(2000),
  category: z.enum(['booking', 'payment', 'property', 'account', 'technical', 'other']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

// ======== Coupon Schemas ========

export const createCouponSchema = z.object({
  code: z.string().min(4).max(20).toUpperCase(),
  title: z.string().min(5).max(100),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_NIGHT']),
  discountValue: z.number().min(0),
  maxDiscount: z.number().optional(),
  minBookingAmount: z.number().optional(),
  usageLimit: z.number().optional(),
  perUserLimit: z.number().default(1),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
})
