'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { PropertyCard } from '@/components/property/PropertyCard'
import { PropertyListItem, PropertyType } from '@/types'
import Link from 'next/link'

const TABS: { label: string; value: string; emoji: string }[] = [
  { label: 'All', value: '', emoji: '🏠' },
  { label: 'PGs', value: 'PG', emoji: '🏡' },
  { label: 'Hostels', value: 'HOSTEL', emoji: '🛏️' },
  { label: 'Co-living', value: 'CO_LIVING', emoji: '🤝' },
  { label: 'Student', value: 'STUDENT_ACCOMMODATION', emoji: '🎓' },
]

function PropertyCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)]">
      <div className="skeleton h-52" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-6 rounded-full w-16" />
          <div className="skeleton h-6 rounded-full w-16" />
        </div>
        <div className="skeleton h-5 rounded w-1/3" />
      </div>
    </div>
  )
}

export function FeaturedProperties() {
  const [activeTab, setActiveTab] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['featured-properties', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '8', sortBy: 'popular' })
      if (activeTab) params.set('propertyType', activeTab)
      const { data } = await axios.get(`/api/properties?${params}`)
      return data.data as { properties: PropertyListItem[] }
    },
    staleTime: 5 * 60 * 1000,
  })

  return (
    <section className="py-20 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Top Picks</p>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">
              Featured Properties
            </h2>
            <p className="text-[var(--text-secondary)] mt-2">Hand-picked, verified accommodations</p>
          </div>
          <Link href="/search" className="hidden md:block text-[var(--primary)] font-semibold hover:opacity-80">
            View all →
          </Link>
        </motion.div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? 'brand-gradient text-white shadow-md'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading
            ? Array(8).fill(0).map((_, i) => <PropertyCardSkeleton key={i} />)
            : data?.properties?.map((property, i) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
        </div>

        {!isLoading && (!data?.properties || data.properties.length === 0) && (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <p className="text-lg">No properties found. Check back soon!</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href={`/search${activeTab ? `?propertyType=${activeTab}` : ''}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
          >
            Explore all properties
          </Link>
        </div>
      </div>
    </section>
  )
}
