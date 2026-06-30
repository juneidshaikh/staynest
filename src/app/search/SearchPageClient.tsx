'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { 
  Map, Grid3X3, List, SlidersHorizontal, X, ChevronDown,
  Search, ArrowUpDown
} from 'lucide-react'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchFilters as SearchFiltersPanel } from '@/components/search/SearchFilters'
import { PropertyListItem, SearchFilters } from '@/types'

type ViewMode = 'grid' | 'list' | 'map'
type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'distance'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'distance', label: 'Distance' },
]

function PropertyListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array(9).fill(0).map((_, i) => (
        <div key={i} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)]">
          <div className="skeleton h-48" />
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
      ))}
    </div>
  )
}

export function SearchPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [page, setPage] = useState(1)

  const buildFilters = useCallback((): SearchFilters => {
    const params: SearchFilters = { page, limit: 18 }
    if (searchParams.get('city')) params.city = searchParams.get('city')!
    if (searchParams.get('query')) params.query = searchParams.get('query')!
    if (searchParams.get('propertyType')) params.propertyType = [searchParams.get('propertyType') as any]
    if (searchParams.get('gender')) params.gender = searchParams.get('gender') as any
    if (searchParams.get('minPrice')) params.minPrice = Number(searchParams.get('minPrice'))
    if (searchParams.get('maxPrice')) params.maxPrice = Number(searchParams.get('maxPrice'))
    if (searchParams.get('latitude')) params.latitude = Number(searchParams.get('latitude'))
    if (searchParams.get('longitude')) params.longitude = Number(searchParams.get('longitude'))
    if (searchParams.get('radius')) params.radius = Number(searchParams.get('radius'))
    if (searchParams.get('isVerified')) params.isVerified = true
    if (searchParams.get('isInstantBook')) params.isInstantBook = true
    if (searchParams.get('noBrokerage')) params.noBrokerage = true
    if (searchParams.get('wifi')) params.amenities = [...(params.amenities || []), 'wifi']
    if (searchParams.get('ac')) params.amenities = [...(params.amenities || []), 'ac']
    if (searchParams.get('food')) params.amenities = [...(params.amenities || []), 'food']
    if (searchParams.get('gym')) params.amenities = [...(params.amenities || []), 'gym']
    if (searchParams.get('laundry')) params.amenities = [...(params.amenities || []), 'laundry']
    if (searchParams.get('parking')) params.amenities = [...(params.amenities || []), 'parking']
    params.sortBy = sortBy
    return params
  }, [searchParams, page, sortBy])

  const filters = buildFilters()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (Array.isArray(v)) v.forEach(val => params.append(k, String(val)))
          else params.set(k, String(v))
        }
      })
      const { data } = await axios.get(`/api/search?${params}`)
      return data.data as { properties: PropertyListItem[]; total: number; totalPages: number }
    },
    staleTime: 2 * 60 * 1000,
  })

  const activeFilterCount = [
    filters.gender,
    filters.propertyType?.length,
    filters.minPrice,
    filters.maxPrice,
    filters.amenities?.length,
    filters.isVerified,
    filters.isInstantBook,
    filters.noBrokerage,
  ].filter(Boolean).length

  const locationLabel = filters.city || (filters.latitude ? 'Near you' : 'All India')

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pt-16 lg:pt-20">
      {/* Search Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-16 lg:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 bg-[var(--bg-secondary)] rounded-xl px-4 py-2.5 max-w-md">
              <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder={`Search in ${locationLabel}...`}
                defaultValue={searchParams.get('query') || ''}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value
                    const params = new URLSearchParams(searchParams.toString())
                    if (val) params.set('query', val)
                    else params.delete('query')
                    router.push(`/search?${params}`)
                  }
                }}
                className="bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full"
              />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                activeFilterCount > 0
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-[var(--primary)] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] py-2 z-50"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); setPage(1) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === opt.value
                            ? 'text-[var(--primary)] bg-[var(--bg-secondary)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl">
              {[
                { mode: 'grid' as ViewMode, Icon: Grid3X3 },
                { mode: 'list' as ViewMode, Icon: List },
                { mode: 'map' as ViewMode, Icon: Map },
              ].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Results count + active filters */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-[var(--text-secondary)]">
              {isLoading ? 'Searching...' : `${data?.total?.toLocaleString() || 0} properties found${filters.city ? ` in ${filters.city}` : ''}`}
            </p>
            {/* Active filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {filters.gender && (
                <FilterChip label={`${filters.gender}`} onRemove={() => removeFilter('gender')} />
              )}
              {filters.isVerified && (
                <FilterChip label="Verified only" onRemove={() => removeFilter('isVerified')} />
              )}
              {filters.isInstantBook && (
                <FilterChip label="Instant Book" onRemove={() => removeFilter('isInstantBook')} />
              )}
              {filters.noBrokerage && (
                <FilterChip label="No Brokerage" onRemove={() => removeFilter('noBrokerage')} />
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <FilterChip
                  label={`₹${filters.minPrice || 0} – ₹${filters.maxPrice || '∞'}`}
                  onRemove={() => { removeFilter('minPrice'); removeFilter('maxPrice') }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'map' ? (
          <MapView properties={data?.properties || []} isLoading={isLoading} />
        ) : (
          <>
            {isLoading || isFetching ? (
              <PropertyListSkeleton />
            ) : data?.properties && data.properties.length > 0 ? (
              <div className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {data.properties.map((property, i) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <PropertyCard
                      property={property}
                      compact={viewMode === 'list'}
                      showDistance={!!filters.latitude}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--primary)] transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      page === p
                        ? 'brand-gradient text-white shadow-md'
                        : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--primary)] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-[var(--surface)] z-50 overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)]">
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
              <SearchFiltersPanel
                currentFilters={filters}
                onApply={(newFilters) => {
                  const params = new URLSearchParams()
                  Object.entries(newFilters).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') {
                      if (Array.isArray(v)) v.forEach(val => params.append(k, String(val)))
                      else params.set(k, String(v))
                    }
                  })
                  router.push(`/search?${params}`)
                  setShowFilters(false)
                  setPage(1)
                }}
                onClose={() => setShowFilters(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )

  function removeFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`/search?${params}`)
  }
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:opacity-70">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

function EmptyState() {
  const router = useRouter()
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">🏠</div>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No properties found</h3>
      <p className="text-[var(--text-secondary)] mb-6">Try adjusting your filters or search in a different area.</p>
      <button onClick={() => router.push('/search')} className="px-6 py-3 brand-gradient text-white rounded-xl font-semibold">
        Clear all filters
      </button>
    </div>
  )
}

function MapView({ properties, isLoading }: { properties: PropertyListItem[]; isLoading: boolean }) {
  return (
    <div className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-[var(--border)] flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="text-center text-[var(--text-secondary)]">
        <Map className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Map view requires Google Maps API key</p>
        <p className="text-sm mt-1">Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env</p>
        <p className="text-xs mt-1 text-[var(--text-tertiary)]">{properties.length} properties in this area</p>
      </div>
    </div>
  )
}
