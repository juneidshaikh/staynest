import { 
  User, Property, Room, Booking, Payment, Review, 
  PropertyType, RoomType, BookingStatus, PaymentStatus,
  PaymentMethod, PropertyStatus, Gender, MealPlan, UserRole 
} from '@prisma/client'

export type { 
  User, Property, Room, Booking, Payment, Review,
  PropertyType, RoomType, BookingStatus, PaymentStatus,
  PaymentMethod, PropertyStatus, Gender, MealPlan, UserRole
}

// ======== Auth Types ========
export interface JWTPayload {
  userId: string
  email?: string
  phone?: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthUser {
  id: string
  email?: string | null
  phone?: string | null
  name?: string | null
  avatarUrl?: string | null
  role: UserRole
  emailVerified: boolean
  phoneVerified: boolean
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

// ======== API Response Types ========
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ======== Search Types ========
export interface SearchFilters {
  query?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  radius?: number
  propertyType?: PropertyType[]
  gender?: Gender
  roomType?: RoomType[]
  minPrice?: number
  maxPrice?: number
  checkInDate?: string
  checkOutDate?: string
  guests?: number
  amenities?: string[]
  mealPlan?: MealPlan
  isVerified?: boolean
  isInstantBook?: boolean
  noBrokerage?: boolean
  hasParking?: boolean
  hasAC?: boolean
  hasWifi?: boolean
  hasGym?: boolean
  hasLaundry?: boolean
  hasStudyRoom?: boolean
  attachedBathroom?: boolean
  electricityIncluded?: boolean
  foodIncluded?: boolean
  petFriendly?: boolean
  minRating?: number
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'newest' | 'distance' | 'discount'
  page?: number
  limit?: number
}

export interface SearchResult {
  properties: PropertyWithDetails[]
  total: number
  page: number
  limit: number
  totalPages: number
  filters: SearchFilters
}

// ======== Property Types ========
export interface PropertyWithDetails extends Property {
  owner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'phone'>
  rooms: Room[]
  amenities: { name: string; icon?: string | null; category?: string | null }[]
  nearbyPlaces: { name: string; type: string; distance: number }[]
  _count: {
    reviews: number
    bookings: number
    wishlistItems: number
  }
  isWishlisted?: boolean
  distanceKm?: number
}

export interface PropertyListItem {
  id: string
  name: string
  slug: string
  coverImage: string
  images: string[]
  propertyType: PropertyType
  city: string
  state: string
  latitude: number
  longitude: number
  basePrice: number
  minPrice?: number | null
  gender: Gender
  averageRating: number
  totalReviews: number
  isVerified: boolean
  isInstantBook: boolean
  noBrokerage: boolean
  amenities: string[]
  availableRooms: number
  isWishlisted?: boolean
  distanceKm?: number
  discountPercentage?: number
}

// ======== Booking Types ========
export interface BookingWithDetails extends Booking {
  user: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'avatarUrl'>
  property: Pick<Property, 'id' | 'name' | 'coverImage' | 'address' | 'city'>
  room?: Room | null
  payments: Payment[]
}

export interface CreateBookingInput {
  propertyId: string
  roomId?: string
  checkInDate: string
  checkOutDate: string
  guestsCount: number
  guestName: string
  guestEmail: string
  guestPhone: string
  specialRequests?: string
  couponCode?: string
  paymentMethod: PaymentMethod
}

// ======== Review Types ========
export interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
  _count: { votes: number }
  userVote?: { isHelpful: boolean }
}

// ======== UI Types ========
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  price: number
  type: PropertyType
  isWishlisted?: boolean
}

export interface PriceBreakdown {
  baseAmount: number
  nights: number
  pricePerNight: number
  discountAmount: number
  couponDiscount: number
  platformFee: number
  gst: number
  totalAmount: number
  securityDeposit: number
}

// ======== Dashboard Types ========
export interface OwnerDashboardStats {
  totalProperties: number
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  activeBookings: number
  averageRating: number
  occupancyRate: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
}

export interface AdminDashboardStats {
  totalUsers: number
  totalOwners: number
  totalProperties: number
  pendingApprovals: number
  totalBookings: number
  totalRevenue: number
  platformRevenue: number
  activeBookings: number
  todayBookings: number
  todayRevenue: number
}
