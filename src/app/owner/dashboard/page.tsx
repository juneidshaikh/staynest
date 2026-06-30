'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Home, Plus, TrendingUp, Calendar, DollarSign, Star,
  Building2, Users, BarChart3, Settings, MessageCircle,
  ChevronRight, Eye, Edit, MoreVertical, CheckCircle, Clock, XCircle
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { OwnerDashboardStats } from '@/types'
import { useAuthStore } from '@/store/auth.store'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Live', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  PENDING_REVIEW: { label: 'Under Review', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Clock className="w-3 h-3" /> },
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: <Edit className="w-3 h-3" /> },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800', icon: <XCircle className="w-3 h-3" /> },
}

export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'bookings' | 'reviews' | 'payouts'>('overview')
  const { user } = useAuthStore()

  const { data: properties } = useQuery({
    queryKey: ['owner-properties'],
    queryFn: async () => {
      const { data } = await axios.get('/api/properties?limit=50')
      return data.data.properties
    },
  })

  const { data: bookings } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/bookings?limit=10')
      return data.data.bookings
    },
  })

  const stats: OwnerDashboardStats = {
    totalProperties: properties?.length || 0,
    totalBookings: bookings?.length || 0,
    totalRevenue: bookings?.reduce((s: number, b: any) => s + (b.status !== 'CANCELLED' ? b.totalAmount : 0), 0) || 0,
    pendingBookings: bookings?.filter((b: any) => b.status === 'PENDING').length || 0,
    activeBookings: bookings?.filter((b: any) => b.status === 'CONFIRMED').length || 0,
    averageRating: properties?.length ? properties.reduce((s: number, p: any) => s + p.averageRating, 0) / properties.length : 0,
    occupancyRate: 78,
    thisMonthRevenue: 145000,
    lastMonthRevenue: 128000,
    revenueGrowth: 13.3,
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--text-primary)]">Owner Dashboard</h1>
              <p className="text-[var(--text-secondary)] mt-1">Welcome back, {user?.name}!</p>
            </div>
            <Link
              href="/owner/properties/new"
              className="flex items-center gap-2 px-5 py-3 rounded-xl brand-gradient text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add New Property
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Properties', value: stats.totalProperties, icon: <Building2 className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
              { label: 'Total Bookings', value: stats.totalBookings, icon: <Calendar className="w-5 h-5" />, color: 'from-purple-500 to-purple-600' },
              { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: <DollarSign className="w-5 h-5" />, color: 'from-green-500 to-green-600' },
              { label: 'Average Rating', value: stats.averageRating.toFixed(1), icon: <Star className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[var(--text-primary)]">Revenue Overview</h3>
              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{stats.revenueGrowth}% vs last month
              </div>
            </div>
            <div className="h-48 flex items-end gap-2">
              {[65, 45, 78, 52, 89, 67, 95, 73, 88, 91, 76, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-[var(--primary)] to-[var(--accent)] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                  />
                  <span className="text-[10px] text-[var(--text-tertiary)]">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto">
            {([
              { key: 'overview', label: 'Overview' },
              { key: 'properties', label: 'My Properties' },
              { key: 'bookings', label: 'Bookings' },
              { key: 'reviews', label: 'Reviews' },
              { key: 'payouts', label: 'Payouts' },
            ] as { key: typeof activeTab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px ${
                  activeTab === tab.key ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Properties Tab */}
          {(activeTab === 'overview' || activeTab === 'properties') && (
            <div className="space-y-4">
              <h3 className="font-bold text-[var(--text-primary)]">{activeTab === 'overview' ? 'Recent Properties' : 'All Properties'}</h3>
              {properties && properties.length > 0 ? (
                properties.slice(0, activeTab === 'overview' ? 3 : undefined).map((property: any) => (
                  <div key={property.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)]">
                      {property.coverImage && <Image src={property.coverImage} alt={property.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[var(--text-primary)] truncate">{property.name}</h4>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[property.status]?.color}`}>
                          {STATUS_CONFIG[property.status]?.icon}
                          {STATUS_CONFIG[property.status]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{property.city}, {property.state}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-tertiary)]">
                        <span>₹{property.basePrice.toLocaleString('en-IN')}/mo</span>
                        <span><Star className="w-3 h-3 inline fill-yellow-400 text-yellow-400" /> {property.averageRating || 'New'}</span>
                        <span>{property.availableRooms}/{property.totalRooms} beds</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/property/${property.id}`} className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                        <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                      </Link>
                      <Link href={`/owner/properties/${property.id}/edit`} className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                        <Edit className="w-4 h-4 text-[var(--text-secondary)]" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)]">
                  <Building2 className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                  <p className="text-[var(--text-secondary)] mb-4">You haven&apos;t listed any properties yet</p>
                  <Link href="/owner/properties/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl brand-gradient text-white font-semibold text-sm">
                    <Plus className="w-4 h-4" /> List Your First Property
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              {bookings && bookings.length > 0 ? bookings.map((booking: any) => (
                <div key={booking.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] text-sm">{booking.guestName}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">#{booking.bookingNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--text-primary)]">₹{booking.totalAmount.toLocaleString('en-IN')}</div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${STATUS_CONFIG[booking.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {booking.status}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center py-12 text-[var(--text-secondary)]">No bookings yet</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-16 text-[var(--text-secondary)]">Reviews will appear here once guests start reviewing your properties.</div>
          )}

          {activeTab === 'payouts' && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-4">Payout Information</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">Payouts are processed weekly to your registered bank account.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                  <div className="text-xs text-[var(--text-tertiary)]">Available Balance</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1">₹{(stats.totalRevenue * 0.97).toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                  <div className="text-xs text-[var(--text-tertiary)]">Next Payout</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1">Friday</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
