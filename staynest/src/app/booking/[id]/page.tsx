'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle2, Calendar, MapPin, Download, Phone, MessageCircle,
  Clock, CreditCard, Shield, Loader2, AlertCircle
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { format } from 'date-fns'
import { BookingWithDetails } from '@/types'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/bookings/${bookingId}`)
      return data.data.booking as BookingWithDetails
    },
  })

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handlePayment = async (method: string) => {
    setIsProcessingPayment(true)
    try {
      const { data } = await axios.post('/api/payments', { bookingId, method })

      if (data.data.gateway === 'razorpay') {
        const options = {
          key: data.data.keyId,
          amount: data.data.amount,
          currency: data.data.currency,
          name: 'StayNest',
          description: `Booking #${booking?.bookingNumber}`,
          order_id: data.data.orderId,
          prefill: data.data.prefill,
          theme: { color: '#FF385C' },
          handler: async (response: any) => {
            try {
              await axios.post('/api/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              })
              toast.success('Payment successful! 🎉')
              refetch()
            } catch {
              toast.error('Payment verification failed')
            }
          },
          modal: {
            ondismiss: () => setIsProcessingPayment(false),
          },
        }
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } else if (data.data.gateway === 'wallet') {
        toast.success('Payment successful via wallet! 🎉')
        refetch()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      </>
    )
  }

  if (!booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <p className="text-[var(--text-secondary)]">Booking not found</p>
        </div>
      </>
    )
  }

  const isPaid = booking.payments.some(p => p.status === 'COMPLETED')
  const isConfirmed = booking.status === 'CONFIRMED'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 mb-6 text-center ${
              isConfirmed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
            }`}
          >
            {isConfirmed ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Booking Confirmed!</h1>
                <p className="text-[var(--text-secondary)] mt-1">Your reservation has been confirmed</p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Complete Your Booking</h1>
                <p className="text-[var(--text-secondary)] mt-1">Please complete payment to confirm your reservation</p>
              </>
            )}
            <p className="text-sm font-mono text-[var(--text-tertiary)] mt-3">Booking #{booking.bookingNumber}</p>
          </motion.div>

          {/* Property Card */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 mb-6">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={booking.property.coverImage} alt={booking.property.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[var(--text-primary)]">{booking.property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {booking.property.address}, {booking.property.city}
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-[var(--text-secondary)]">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    {format(new Date(booking.checkInDate), 'MMM d')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 mb-6">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Booking Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Guest Name', value: booking.guestName },
                { label: 'Email', value: booking.guestEmail },
                { label: 'Phone', value: booking.guestPhone },
                { label: 'Guests', value: `${booking.guestsCount} ${booking.guestsCount > 1 ? 'people' : 'person'}` },
                { label: 'Duration', value: `${booking.totalDays} days` },
                { label: 'Status', value: booking.status.replace('_', ' ') },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="font-medium text-[var(--text-primary)] capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 mb-6">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Payment Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Base Amount</span>
                <span className="text-[var(--text-primary)]">₹{booking.baseAmount.toLocaleString('en-IN')}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{booking.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({booking.couponCode})</span>
                  <span>-₹{booking.couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Taxes & Fees</span>
                <span className="text-[var(--text-primary)]">₹{booking.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              {booking.securityDeposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Security Deposit (refundable)</span>
                  <span className="text-[var(--text-primary)]">₹{booking.securityDeposit.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-3 border-t border-[var(--border)] text-base">
                <span className="text-[var(--text-primary)]">Total Amount</span>
                <span className="text-[var(--text-primary)]">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!isPaid && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 mb-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-4">Choose Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { method: 'RAZORPAY', label: 'UPI / Cards / Netbanking', icon: '💳' },
                  { method: 'WALLET', label: 'StayNest Wallet', icon: '👛' },
                ].map(opt => (
                  <button
                    key={opt.method}
                    onClick={() => handlePayment(opt.method)}
                    disabled={isProcessingPayment}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors disabled:opacity-50"
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] text-left">{opt.label}</span>
                  </button>
                ))}
              </div>
              {isProcessingPayment && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing payment...
                </div>
              )}
            </div>
          )}

          {/* Success Actions */}
          {isPaid && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm hover:border-[var(--primary)] transition-colors">
                <Download className="w-4 h-4" /> Download Invoice
              </button>
              <a href={`tel:${booking.property.owner?.phone}`} className="flex items-center justify-center gap-2 py-3.5 rounded-xl brand-gradient text-white font-semibold text-sm">
                <Phone className="w-4 h-4" /> Call Owner
              </a>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/bookings" className="flex-1 text-center py-3.5 rounded-xl border-2 border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm hover:border-[var(--primary)] transition-colors">
              View All Bookings
            </Link>
            <Link href="/" className="flex-1 text-center py-3.5 rounded-xl text-[var(--primary)] font-semibold text-sm">
              Back to Home
            </Link>
          </div>

          {/* Trust Footer */}
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-[var(--text-tertiary)]">
            <Shield className="w-4 h-4" />
            Your payment is secured with 256-bit SSL encryption
          </div>
        </div>
      </div>
    </>
  )
}
