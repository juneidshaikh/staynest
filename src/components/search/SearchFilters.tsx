'use client'

import React, { useState } from 'react'
import { SearchFilters } from '@/types'
import { Check } from 'lucide-react'

interface SearchFiltersProps {
  currentFilters: SearchFilters
  onApply: (filters: SearchFilters) => void
  onClose: () => void
}

const AMENITY_OPTIONS = [
  { key: 'wifi', label: 'WiFi', emoji: '📶' },
  { key: 'ac', label: 'Air Conditioning', emoji: '❄️' },
  { key: 'food', label: 'Food Included', emoji: '🍽️' },
  { key: 'laundry', label: 'Laundry', emoji: '👕' },
  { key: 'gym', label: 'Gym', emoji: '💪' },
  { key: 'parking', label: 'Parking', emoji: '🚗' },
  { key: 'study_room', label: 'Study Room', emoji: '📚' },
  { key: 'power_backup', label: 'Power Backup', emoji: '⚡' },
  { key: 'lift', label: 'Lift/Elevator', emoji: '🛗' },
  { key: 'cctv', label: 'CCTV Security', emoji: '📷' },
  { key: 'security', label: 'Security Guard', emoji: '💂' },
  { key: 'balcony', label: 'Balcony', emoji: '🌿' },
  { key: 'pet_friendly', label: 'Pet Friendly', emoji: '🐾' },
  { key: 'attached_bathroom', label: 'Attached Bathroom', emoji: '🚿' },
]

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Single Room' },
  { value: 'DOUBLE', label: 'Double Sharing' },
  { value: 'TRIPLE', label: 'Triple Sharing' },
  { value: 'DORMITORY', label: 'Dormitory' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'PRIVATE_ROOM', label: 'Private Room' },
]

const PROPERTY_TYPES = [
  { value: 'PG', label: 'PG', emoji: '🏠' },
  { value: 'HOSTEL', label: 'Hostel', emoji: '🛏️' },
  { value: 'CO_LIVING', label: 'Co-living', emoji: '🤝' },
  { value: 'STUDENT_ACCOMMODATION', label: 'Student Housing', emoji: '🎓' },
]

const GENDER_OPTIONS = [
  { value: 'MALE', label: '👨 Men Only' },
  { value: 'FEMALE', label: '👩 Women Only' },
  { value: 'ANY', label: '👥 Mixed/Any' },
]

const RATING_OPTIONS = [
  { value: 4.5, label: '4.5+ ⭐⭐⭐⭐⭐' },
  { value: 4, label: '4.0+ ⭐⭐⭐⭐' },
  { value: 3.5, label: '3.5+ ⭐⭐⭐' },
]

export function SearchFilters({ currentFilters, onApply, onClose }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({ ...currentFilters })
  const [priceRange, setPriceRange] = useState<[number, number]>([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || 50000,
  ])

  const toggleAmenity = (key: string) => {
    const current = filters.amenities || []
    const updated = current.includes(key)
      ? current.filter(a => a !== key)
      : [...current, key]
    setFilters(f => ({ ...f, amenities: updated }))
  }

  const togglePropertyType = (value: string) => {
    const current = (filters.propertyType as string[]) || []
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value]
    setFilters(f => ({ ...f, propertyType: updated as any }))
  }

  const toggleRoomType = (value: string) => {
    const current = (filters.roomType as string[]) || []
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value]
    setFilters(f => ({ ...f, roomType: updated as any }))
  }

  const handleApply = () => {
    onApply({
      ...filters,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
    })
  }

  const handleReset = () => {
    setFilters({ page: 1, limit: 18 })
    setPriceRange([0, 50000])
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-[var(--border)] px-6 py-5">
      <h3 className="font-bold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button onClick={onChange} className="flex items-center gap-3 w-full text-left py-1.5">
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Property Type */}
        <Section title="Property Type">
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPES.map(type => {
              const isSelected = (filters.propertyType as string[] || []).includes(type.value)
              return (
                <button
                  key={type.value}
                  onClick={() => togglePropertyType(type.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <span>{type.emoji}</span>
                  {type.label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Price Range */}
        <Section title="Budget (per month)">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
              <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span>₹{priceRange[1].toLocaleString('en-IN')}{priceRange[1] >= 50000 ? '+' : ''}</span>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={500}
              value={priceRange[0]}
              onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="w-full accent-[var(--primary)]"
            />
            <input
              type="range"
              min={0}
              max={50000}
              step={500}
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex gap-2">
              {[5000, 10000, 15000, 20000, 30000].map(price => (
                <button
                  key={price}
                  onClick={() => setPriceRange([0, price])}
                  className="text-xs px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  ≤₹{price / 1000}k
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Gender */}
        <Section title="Gender Preference">
          <div className="space-y-1">
            {GENDER_OPTIONS.map(opt => (
              <Checkbox
                key={opt.value}
                checked={filters.gender === opt.value}
                onChange={() => setFilters(f => ({ ...f, gender: f.gender === opt.value as any ? undefined : opt.value as any }))}
                label={opt.label}
              />
            ))}
          </div>
        </Section>

        {/* Room Type */}
        <Section title="Room Type">
          <div className="grid grid-cols-2 gap-2">
            {ROOM_TYPES.map(type => {
              const isSelected = (filters.roomType as string[] || []).includes(type.value)
              return (
                <button
                  key={type.value}
                  onClick={() => toggleRoomType(type.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  {type.label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Amenities */}
        <Section title="Amenities">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {AMENITY_OPTIONS.map(amenity => (
              <Checkbox
                key={amenity.key}
                checked={(filters.amenities || []).includes(amenity.key)}
                onChange={() => toggleAmenity(amenity.key)}
                label={`${amenity.emoji} ${amenity.label}`}
              />
            ))}
          </div>
        </Section>

        {/* Ratings */}
        <Section title="Minimum Rating">
          <div className="space-y-1">
            {RATING_OPTIONS.map(opt => (
              <Checkbox
                key={opt.value}
                checked={filters.minRating === opt.value}
                onChange={() => setFilters(f => ({ ...f, minRating: f.minRating === opt.value ? undefined : opt.value }))}
                label={opt.label}
              />
            ))}
          </div>
        </Section>

        {/* Special */}
        <Section title="Special Filters">
          <div className="space-y-1">
            <Checkbox
              checked={!!filters.isVerified}
              onChange={() => setFilters(f => ({ ...f, isVerified: !f.isVerified }))}
              label="✅ Verified properties only"
            />
            <Checkbox
              checked={!!filters.isInstantBook}
              onChange={() => setFilters(f => ({ ...f, isInstantBook: !f.isInstantBook }))}
              label="⚡ Instant booking"
            />
            <Checkbox
              checked={!!filters.noBrokerage}
              onChange={() => setFilters(f => ({ ...f, noBrokerage: !f.noBrokerage }))}
              label="🚫 No brokerage"
            />
          </div>
        </Section>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--primary)] transition-colors"
        >
          Reset All
        </button>
        <button
          onClick={handleApply}
          className="flex-2 flex-grow py-3 rounded-xl brand-gradient text-white text-sm font-semibold"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}
