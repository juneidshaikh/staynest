'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Users, Building2, DollarSign, TrendingUp, CheckCircle, XCircle,
  AlertTriangle, Search, Filter, MoreVertical, Eye, Ban, Shield
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AdminDashboardStats } from '@/types'
import toast from 'react-hot-toast'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users' | 'bookings' | 'payments'>('overview')
  const queryClient = useQueryClient()

  const { data: pendingProperties } = useQuery({
    queryKey: ['admin-pending-properties'],
    queryFn: async () => {
      const { data } = await axios.get('/api/properties?status=PENDING_REVIEW&limit=20')
      return data.data.properties
    },
  })

  const approveProperty = useMutation({
    mutationFn: async (id: string) => {
      await axios.put(`/api/properties/${id}`, { status: 'ACTIVE', isVerified: true, approvedAt: new Date() })
    },
    onSuccess: () => {
      toast.success('Property approved!')
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] })
    },
  })

  const rejectProperty = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await axios.put(`/api/properties/${id}`, { status: 'REJECTED', rejectionReason: reason })
    },
    onSuccess: () => {
      toast.success('Property rejected')
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] })
    },
  })

  const stats: AdminDashboardStats = {
    totalUsers: 24580,
    totalOwners: 3420,
    totalProperties: 8920,
    pendingApprovals: pendingProperties?.length || 0,
    totalBookings: 45210,
    totalRevenue: 89500000,
    platformRevenue: 2685000,
    activeBookings: 3240,
    todayBookings: 142,
    todayRevenue: 285000,
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-[var(--text-primary)]">Admin Panel</h1>
              <p className="text-[var(--text-secondary)] text-sm">Platform management and oversight</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users className="w-5 h-5" />, color: 'from-blue-500 to-blue-600' },
              { label: 'Total Properties', value: stats.totalProperties.toLocaleString(), icon: <Building2 className="w-5 h-5" />, color: 'from-purple-500 to-purple-600' },
              { label: 'Platform Revenue', value: `₹${(stats.platformRevenue / 100000).toFixed(1)}L`, icon: <DollarSign className="w-5 h-5" />, color: 'from-green-500 to-green-600' },
              { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-orange-500 to-red-500', highlight: stats.pendingApprovals > 0 },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-[var(--surface)] rounded-2xl p-5 border ${stat.highlight ? 'border-orange-300 dark:border-orange-700' : 'border-[var(--border)]'}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto">
            {([
              { key: 'overview', label: 'Overview' },
              { key: 'properties', label: `Pending Properties (${stats.pendingApprovals})` },
              { key: 'users', label: 'Users' },
              { key: 'bookings', label: 'Bookings' },
              { key: 'payments', label: 'Payments & Refunds' },
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

          {/* Pending Properties */}
          {(activeTab === 'overview' || activeTab === 'properties') && (
            <div className="space-y-4">
              <h3 className="font-bold text-[var(--text-primary)]">Properties Awaiting Approval</h3>
              {pendingProperties && pendingProperties.length > 0 ? (
                pendingProperties.map((property: any) => (
                  <div key={property.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)]">
                        {property.coverImage && <Image src={property.coverImage} alt={property.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--text-primary)] truncate">{property.name}</h4>
                        <p className="text-sm text-[var(--text-secondary)]">{property.city}, {property.state}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Owner: {property.owner?.name} • ₹{property.basePrice}/mo</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => approveProperty.mutate(property.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:')
                            if (reason) rejectProperty.mutate({ id: property.id, reason })
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 text-sm font-semibold transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)]">All caught up! No pending approvals.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
              <Users className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)]">User management interface — search, ban, verify users</p>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--text-secondary)]">Platform-wide booking oversight and dispute resolution</p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--text-secondary)]">Payment reconciliation, refund processing, and payout management</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
