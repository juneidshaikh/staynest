'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Calendar, Users, Tag, ChevronDown, Bolt, Shield, BadgeCheck } from 'lucide-react'
import { PropertyWithDetails } from '@/types'
import { calculateBookingPrice } from '@/lib/payments'
import { useAuthStore } from '@/store/auth.store'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format, addMonths } from 'date-fns'

interface BookingWidgetProps {
  property: PropertyWithDetails
}

export function BookingWidget({ property }: BookingWidgetProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  })
  const [checkOut, setCheckOut] = useState(() => {
    const d = addMonths(new Date(), 1)
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  })
  const [guests, setGuests] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState(property.rooms[0]?.id || '')
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showCoupon, setShowCoupon] = useState(false)

  const selectedRoomData = property.rooms.find(r => r.id === selectedRoom)
  const pricePerMonth = selectedRoomData?.pricePerMonth || property.basePrice

  const pricing = calculateBookingPrice({
    pricePerMonth,
    checkInDate: new Date(checkIn),
    checkOutDate: new Date(checkOut),
    securityDeposit: property.securityDeposit,
  })

  const totalWithCoupon = Math.max(0, pricing.totalAmount - couponDiscount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const { data } = await axios.post('/api/coupons/validate', {
        code: couponCode.toUpperCase(),
        amount: pricing.baseAmount,
        propertyId: property.id,
      })
      if (data.success) {
        setCouponDiscount(data.data.discount)
        setCouponApplied(true)
        toast.success(`Coupon applied! Saved ₹${data.data.discount.toLocaleString('en-IN')}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid coupon')
    }
  }

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select dates')
      return
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      toast.error('Check-out must be after check-in')
      return
    }

    setIsLoading(true)
    try {
      const { data } = await axios.post('/api/bookings', {
        propertyId: property.id,
        roomId: selectedRoom || undefined,
        checkInDate: new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        guestsCount: guests,
        guestName: user?.name || '',
        guestEmail: user?.email || '',
        guestPhone: '',
        couponCode: couponApplied ? couponCode : undefined,
        paymentMethod: 'RAZORPAY',
      })

      if (data.success) {
        router.push(`/booking/${data.data.booking.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create booking')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-lg)] p-6"
    >
      {/* Price Header */}
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-3xl font-bold text-[var(--text-primary)]">
          ₹{pricePerMonth.toLocaleString('en-IN')}
        </span>
        <span className="text-[var(--text-secondary)]">/month</span>
        {property.availableRooms > 0 && (
          <span className="ml-auto text-sm text-green-600 dark:text-green-400 font-medium">
            {property.availableRooms} beds left
          </span>
        )}
      </div>

      {/* Room selector */}
      {property.rooms.length > 1 && (
        <div className="mb-4">
          <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">Room Type</label>
          <div className="relative">
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none appearance-none cursor-pointer"
            >
              {property.rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} – ₹{room.pricePerMonth.toLocaleString('en-IN')}/month
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
          </div>
        </div>
      )}

      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="border border-[var(--border)] rounded-xl p-3">
          <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Check-in</div>
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
          />
        </div>
        <div className="border border-[var(--border)] rounded-xl p-3">
          <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Check-out</div>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={e => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Guests */}
      <div className="border border-[var(--border)] rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Guests</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuests(g => Math.max(1, g - 1))}
              className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--primary)] transition-colors font-bold"
            >
              -
            </button>
            <span className="text-sm font-bold text-[var(--text-primary)] w-4 text-center">{guests}</span>
            <button
              onClick={() => setGuests(g => Math.min(10, g + 1))}
              className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--primary)] transition-colors font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="mb-4">
        <button
          onClick={() => setShowCoupon(!showCoupon)}
          className="flex items-center gap-2 text-sm text-[var(--primary)] font-medium"
        >
          <Tag className="w-4 h-4" />
          {couponApplied ? `Coupon applied: -₹${couponDiscount.toLocaleString('en-IN')}` : 'Have a coupon?'}
        </button>
        {showCoupon && !couponApplied && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 border border-[var(--border)] rounded-xl px-3 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-4 py-2 brand-gradient text-white text-sm font-semibold rounded-xl"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2.5 border-t border-[var(--border)] pt-4 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">₹{Math.round(pricing.pricePerNight).toLocaleString('en-IN')} × {pricing.nights} nights</span>
          <span className="text-[var(--text-primary)] font-medium">₹{Math.round(pricing.baseAmount).toLocaleString('en-IN')}</span>
        </div>
        {pricing.discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span>-₹{Math.round(pricing.discountAmount).toLocaleString('en-IN')}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
            <span>Coupon ({couponCode})</span>
            <span>-₹{Math.round(couponDiscount).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Platform fee</span>
          <span className="text-[var(--text-primary)]">₹{Math.round(pricing.platformFee).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">GST (18%)</span>
          <span className="text-[var(--text-primary)]">₹{Math.round(pricing.gst).toLocaleString('en-IN')}</span>
        </div>
        {pricing.securityDeposit > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Security deposit (refundable)</span>
            <span className="text-[var(--text-primary)]">₹{Math.round(pricing.securityDeposit).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-bold pt-2 border-t border-[var(--border)]">
          <span className="text-[var(--text-primary)]">Total</span>
          <span className="text-[var(--text-primary)] text-lg">₹{Math.round(totalWithCoupon).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Book Button */}
      <motion.button
        onClick={handleBook}
        disabled={isLoading || property.availableRooms === 0}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full brand-gradient text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="spinner border-white border-t-transparent" />
        ) : property.isInstantBook ? (
          <><Bolt className="w-5 h-5" /> Book Instantly</>
        ) : (
          'Request to Book'
        )}
      </motion.button>

      {/* Trust signals */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          Secure payment with 256-bit SSL
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
          Free cancellation up to 7 days before check-in
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
          No advance payment required for reservation
        </div>
      </div>
    </motion.div>
  )
}
