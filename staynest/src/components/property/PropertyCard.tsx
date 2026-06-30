'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Star, MapPin, Wifi, Car, UtensilsCrossed, Zap, BadgeCheck, Bolt } from 'lucide-react'
import { PropertyListItem, PropertyType, Gender } from '@/types'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface PropertyCardProps {
  property: PropertyListItem
  compact?: boolean
  showDistance?: boolean
}

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  PG: 'PG',
  HOSTEL: 'Hostel',
  CO_LIVING: 'Co-living',
  STUDENT_ACCOMMODATION: 'Student Housing',
}

const GENDER_LABELS: Record<Gender, string> = {
  MALE: '👨 Men',
  FEMALE: '👩 Women',
  OTHER: 'Other',
  ANY: '👥 Mixed',
}

const GENDER_COLORS: Record<Gender, string> = {
  MALE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FEMALE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  OTHER: 'bg-purple-100 text-purple-700',
  ANY: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export function PropertyCard({ property, compact = false, showDistance = false }: PropertyCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(property.isWishlisted || false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const allImages = [property.coverImage, ...property.images.slice(0, 4)].filter(Boolean)

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setWishlistLoading(true)
    try {
      if (isWishlisted) {
        await axios.delete(`/api/wishlist/${property.id}`)
        setIsWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await axios.post('/api/wishlist', { propertyId: property.id })
        setIsWishlisted(true)
        toast.success('Saved to wishlist')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setWishlistLoading(false)
    }
  }

  const amenityIcons = [
    { key: 'wifi', icon: <Wifi className="w-3.5 h-3.5" />, label: 'WiFi' },
    { key: 'parking', icon: <Car className="w-3.5 h-3.5" />, label: 'Parking' },
    { key: 'food', icon: <UtensilsCrossed className="w-3.5 h-3.5" />, label: 'Food' },
    { key: 'power_backup', icon: <Zap className="w-3.5 h-3.5" />, label: 'Power' },
  ].filter(a => property.amenities?.includes(a.key))

  return (
    <Link href={`/property/${property.id}`}>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 cursor-pointer"
      >
        {/* Image Gallery */}
        <div className={`relative overflow-hidden ${compact ? 'h-44' : 'h-52 sm:h-56'}`}>
          <Image
            src={allImages[currentImageIndex] || '/placeholder-property.jpg'}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Image Navigation Dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); setCurrentImageIndex(idx) }}
                  className={`rounded-full transition-all ${idx === currentImageIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {/* Prev/Next arrows on hover */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length) }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold shadow"
              >‹</button>
              <button
                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(i => (i + 1) % allImages.length) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold shadow"
              >›</button>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {property.isVerified && (
              <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {property.isInstantBook && (
              <span className="flex items-center gap-1 bg-[var(--primary)] text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                <Bolt className="w-3 h-3" /> Instant
              </span>
            )}
            {property.noBrokerage && (
              <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                No Brokerage
              </span>
            )}
          </div>

          {/* Discount badge */}
          {property.discountPercentage && property.discountPercentage > 0 && (
            <div className="absolute top-3 right-12 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{property.discountPercentage}%
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow transition-all hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-[var(--primary)] text-[var(--primary)]' : 'text-gray-600 dark:text-gray-300'}`}
            />
          </button>

          {/* Property type */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {PROPERTY_TYPE_LABELS[property.propertyType]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight line-clamp-2 flex-1">
              {property.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {property.averageRating > 0 ? property.averageRating.toFixed(1) : 'New'}
              </span>
              {property.totalReviews > 0 && (
                <span className="text-xs text-[var(--text-tertiary)]">({property.totalReviews})</span>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
            <span className="text-xs text-[var(--text-secondary)] truncate">
              {property.city}, {property.state}
            </span>
            {showDistance && property.distanceKm && (
              <span className="text-xs text-[var(--primary)] ml-auto flex-shrink-0">
                {property.distanceKm < 1
                  ? `${Math.round(property.distanceKm * 1000)}m`
                  : `${property.distanceKm.toFixed(1)}km`}
              </span>
            )}
          </div>

          {/* Tags Row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GENDER_COLORS[property.gender]}`}>
              {GENDER_LABELS[property.gender]}
            </span>
            {amenityIcons.slice(0, 3).map(a => (
              <span key={a.key} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                {a.icon}
                {a.label}
              </span>
            ))}
          </div>

          {/* Price Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-[var(--text-tertiary)]">from</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  ₹{(property.minPrice || property.basePrice).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">/month</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${property.availableRooms > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {property.availableRooms > 0 ? `${property.availableRooms} beds available` : 'Fully booked'}
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}
