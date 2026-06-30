'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star, MapPin, Heart, Share2, BadgeCheck, Wifi, Car,
  UtensilsCrossed, Zap, Dumbbell, BookOpen, ChevronLeft,
  ChevronRight, X, Phone, MessageCircle, Calendar, Users,
  Shield, Clock, AlertTriangle, Check, Bolt, Award, Camera
} from 'lucide-react'
import { PropertyWithDetails } from '@/types'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { ReviewsSection } from '@/components/property/ReviewsSection'
import { useAuthStore } from '@/store/auth.store'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  food: <UtensilsCrossed className="w-5 h-5" />,
  power_backup: <Zap className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  study_room: <BookOpen className="w-5 h-5" />,
}

export function PropertyDetailClient({ propertyId }: { propertyId: string }) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'reviews' | 'location'>('overview')
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/properties/${propertyId}`)
      setIsWishlisted(data.data.property.isWishlisted)
      return data.data.property as PropertyWithDetails
    },
  })

  const property = data

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    try {
      if (isWishlisted) {
        await axios.delete(`/api/wishlist/${propertyId}`)
        setIsWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await axios.post('/api/wishlist', { propertyId })
        setIsWishlisted(true)
        toast.success('Saved to wishlist ❤️')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: property?.name || 'Property on StayNest',
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  if (isLoading) return <PropertyDetailSkeleton />
  if (!property) return <div className="pt-24 text-center text-[var(--text-secondary)] py-20">Property not found</div>

  const allImages = [property.coverImage, ...property.images].filter(Boolean)

  return (
    <div className="pt-16 lg:pt-20 bg-[var(--bg)] min-h-screen">
      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-80 sm:h-96 lg:h-[480px]">
          {/* Main image */}
          <div
            className="col-span-4 lg:col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => { setGalleryIndex(0); setGalleryOpen(true) }}
          >
            <Image src={allImages[0] || '/placeholder-property.jpg'} alt={property.name} fill className="object-cover group-hover:brightness-90 transition-all" />
          </div>
          {/* Thumbnails */}
          {allImages.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="relative cursor-pointer group hidden lg:block"
              onClick={() => { setGalleryIndex(i + 1); setGalleryOpen(true) }}
            >
              <Image src={img} alt={`${property.name} ${i + 2}`} fill className="object-cover group-hover:brightness-90 transition-all" />
              {i === 3 && allImages.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-sm font-semibold">+{allImages.length - 5} photos</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show all photos button */}
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setGalleryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <Camera className="w-4 h-4" />
            View all {allImages.length} photos
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full">
                      {property.propertyType.replace('_', ' ')}
                    </span>
                    {property.isVerified && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                    {property.isInstantBook && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
                        <Bolt className="w-3.5 h-3.5" /> Instant Book
                      </span>
                    )}
                    {property.noBrokerage && (
                      <span className="text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full">
                        No Brokerage
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)]">{property.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-[var(--text-secondary)]">{property.address}, {property.city}, {property.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={handleShare} className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                    <Share2 className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                  <button onClick={handleWishlist} className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                    <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`} />
                  </button>
                </div>
              </div>

              {/* Rating Row */}
              <div className="flex items-center flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-[var(--text-primary)]">{property.averageRating > 0 ? property.averageRating.toFixed(1) : 'New'}</span>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">({property.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Users className="w-4 h-4" />
                  {property._count.bookings}+ guests hosted
                </div>
                <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                  <Award className="w-4 h-4 text-[var(--primary)]" />
                  {property.gender === 'ANY' ? 'Co-ed' : property.gender === 'MALE' ? 'Men only' : 'Women only'}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--border)]">
              {([
                { key: 'overview', label: 'Overview' },
                { key: 'rooms', label: `Rooms (${property.rooms.length})` },
                { key: 'reviews', label: `Reviews (${property.totalReviews})` },
                { key: 'location', label: 'Location' },
              ] as { key: typeof activeTab; label: string }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                    activeTab === tab.key
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">About this property</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map(amenity => (
                      <div key={amenity.name} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <div className="text-[var(--primary)]">
                          {AMENITY_ICONS[amenity.name.toLowerCase()] || <Check className="w-5 h-5" />}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                          {amenity.name.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="bg-[var(--bg-secondary)] rounded-2xl p-5">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Pricing & Policies</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Base rent', value: `₹${property.basePrice.toLocaleString('en-IN')}/month` },
                      { label: 'Security deposit', value: property.securityDeposit > 0 ? `₹${property.securityDeposit.toLocaleString('en-IN')}` : 'None' },
                      { label: 'Minimum stay', value: `${property.minStayDays} days` },
                      { label: 'Notice period', value: `${property.noticePeriodDays} days` },
                      { label: 'Check-in time', value: property.checkInTime },
                      { label: 'Check-out time', value: property.checkOutTime },
                      { label: 'Meal plan', value: property.mealPlan.replace('_', ' ') || 'None' },
                      { label: 'Electricity', value: property.electricityCharge || 'Check with owner' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="text-xs text-[var(--text-tertiary)] mb-0.5">{item.label}</div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* House Rules */}
                {property.rules.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">House Rules</h2>
                    <div className="space-y-2">
                      {property.rules.map((rule, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-[var(--text-secondary)]">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Places */}
                {property.nearbyPlaces.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">What&apos;s Nearby</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {property.nearbyPlaces.slice(0, 8).map(place => (
                        <div key={place.id || place.name} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                          <span className="text-xl">
                            {place.type === 'college' ? '🎓' : place.type === 'company' ? '🏢' : place.type === 'hospital' ? '🏥' : place.type === 'metro' ? '🚇' : '📍'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)] truncate">{place.name}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">{place.distance} km</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Info */}
                <div className="bg-[var(--bg-secondary)] rounded-2xl p-5">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Hosted by</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-[var(--border)]">
                      {property.owner.avatarUrl ? (
                        <Image src={property.owner.avatarUrl} alt={property.owner.name || 'Owner'} width={56} height={56} className="object-cover" />
                      ) : (
                        <div className="w-full h-full brand-gradient flex items-center justify-center text-white text-xl font-bold">
                          {property.owner.name?.[0] || 'O'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text-primary)] text-lg">{property.owner.name}</div>
                      <div className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Member since {format(new Date(property.createdAt), 'MMMM yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {property.owner.phone && (
                        <a
                          href={`tel:${property.owner.phone}`}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                      )}
                      <Link
                        href={`/messages?to=${property.owner.id}&property=${property.id}`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-gradient text-white text-sm font-semibold"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Available Rooms</h2>
                {property.rooms.length > 0 ? (
                  property.rooms.map(room => (
                    <div key={room.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 hover:border-[var(--primary)] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[var(--text-primary)]">{room.name}</h3>
                            <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                              {room.roomType.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-2">
                            <span><Users className="w-3.5 h-3.5 inline mr-1" />{room.capacity} person{room.capacity > 1 ? 's' : ''}</span>
                            {room.size && <span>📐 {room.size} sq ft</span>}
                            {room.floor !== null && <span>🏢 Floor {room.floor}</span>}
                          </div>
                          {room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {room.amenities.slice(0, 5).map(a => (
                                <span key={a} className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full capitalize">
                                  {a.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-[var(--text-primary)]">₹{room.pricePerMonth.toLocaleString('en-IN')}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">per month</div>
                          <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                            {room.availableBeds}/{room.totalBeds} beds available
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[var(--text-secondary)] py-12">No rooms available currently</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewsSection propertyId={property.id} />
            )}

            {activeTab === 'location' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Location</h2>
                <div className="bg-[var(--bg-secondary)] rounded-2xl p-4">
                  <p className="text-[var(--text-secondary)] mb-2">{property.address}, {property.city}, {property.state} {property.pincode}</p>
                  {property.landmark && <p className="text-sm text-[var(--text-tertiary)]">📍 Near {property.landmark}</p>}
                </div>
                <div className="h-80 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center">
                  <div className="text-center text-[var(--text-secondary)]">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Map requires Google Maps API key</p>
                    <p className="text-sm">Lat: {property.latitude}, Lng: {property.longitude}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingWidget property={property} />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {galleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setGalleryOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-xl"
              onClick={() => setGalleryOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute top-4 left-4 text-white text-sm">
              {galleryIndex + 1} / {allImages.length}
            </div>
            <button
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => (i - 1 + allImages.length) % allImages.length) }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-5xl max-h-[85vh] mx-16" onClick={e => e.stopPropagation()}>
              <Image
                src={allImages[galleryIndex]}
                alt={`${property.name} ${galleryIndex + 1}`}
                width={1200}
                height={800}
                className="object-contain max-h-[85vh] mx-auto"
              />
            </div>
            <button
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => (i + 1) % allImages.length) }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PropertyDetailSkeleton() {
  return (
    <div className="pt-20 max-w-7xl mx-auto px-4 py-6">
      <div className="skeleton h-80 rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-8 rounded w-3/4" />
          <div className="skeleton h-4 rounded w-1/2" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  )
}
