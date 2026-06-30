'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Search, MapPin, Calendar, Users, Filter, 
  ChevronDown, Sparkles, TrendingUp 
} from 'lucide-react'

const POPULAR_SEARCHES = [
  'PG in Bangalore', 'Hostel in Pune', 'Co-living Delhi', 
  'Student PG near IIT', 'Working women PG Mumbai'
]

const PROPERTY_TYPES = [
  { value: 'PG', label: 'PG', emoji: '🏠' },
  { value: 'HOSTEL', label: 'Hostel', emoji: '🛏️' },
  { value: 'CO_LIVING', label: 'Co-living', emoji: '🤝' },
  { value: 'STUDENT_ACCOMMODATION', label: 'Student Housing', emoji: '🎓' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Any Gender' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
]

const BUDGET_OPTIONS = [
  { value: '', label: 'Any Budget' },
  { value: '0-5000', label: 'Under ₹5,000' },
  { value: '5000-10000', label: '₹5,000 – ₹10,000' },
  { value: '10000-20000', label: '₹10,000 – ₹20,000' },
  { value: '20000-50000', label: '₹20,000 – ₹50,000' },
  { value: '50000+', label: '₹50,000+' },
]

export function HeroSection() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('PG')
  const [gender, setGender] = useState('')
  const [budget, setBudget] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const locationRef = useRef<HTMLInputElement>(null)

  // Amenity toggles
  const [amenities, setAmenities] = useState({
    wifi: false, ac: false, food: false, laundry: false,
    gym: false, parking: false, studyRoom: false
  })

  const INDIAN_CITIES = [
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 
    'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Visakhapatnam', 'Bhopal',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra',
    'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi',
    'Gurgaon', 'Noida', 'Mysore', 'Coimbatore', 'Kochi'
  ]

  const handleLocationInput = (value: string) => {
    setLocation(value)
    if (value.length > 1) {
      const filtered = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
      setLocationSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSearch = () => {
    setIsSearching(true)
    const params = new URLSearchParams()
    if (location) params.set('city', location)
    if (propertyType) params.set('propertyType', propertyType)
    if (gender) params.set('gender', gender)
    if (budget) {
      const [min, max] = budget.split('-')
      if (min) params.set('minPrice', min)
      if (max && max !== '+') params.set('maxPrice', max)
    }
    Object.entries(amenities).forEach(([key, val]) => {
      if (val) params.set(key, 'true')
    })
    router.push(`/search?${params.toString()}`)
  }

  const useCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          router.push(`/search?latitude=${latitude}&longitude=${longitude}&radius=5`)
        },
        () => {
          alert('Unable to get your location. Please enter it manually.')
        }
      )
    }
  }

  const amenityList = [
    { key: 'wifi', label: 'WiFi', emoji: '📶' },
    { key: 'ac', label: 'AC', emoji: '❄️' },
    { key: 'food', label: 'Food', emoji: '🍽️' },
    { key: 'laundry', label: 'Laundry', emoji: '👕' },
    { key: 'gym', label: 'Gym', emoji: '💪' },
    { key: 'parking', label: 'Parking', emoji: '🚗' },
    { key: 'studyRoom', label: 'Study Room', emoji: '📚' },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, rgba(255,56,92,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(0,180,216,0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.2) 0%, transparent 50%)
            `
          }}
        />
        {/* Animated orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-20"
            style={{
              width: `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              background: i % 2 === 0 ? '#FF385C' : '#00B4D8',
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [0, -30, 0, 30, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5,
            }}
          />
        ))}
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>India&apos;s most trusted PG & Hostel platform</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white leading-tight">
            Find Your Perfect
            <br />
            <span className="gradient-text">Home Away</span>
            {' '}from Home
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            Discover verified PGs, hostels, co-living spaces, and student accommodations across 200+ Indian cities.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-8 mb-8"
        >
          {[
            { value: '50,000+', label: 'Properties' },
            { value: '200+', label: 'Cities' },
            { value: '2M+', label: 'Happy Guests' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="glass-strong rounded-3xl p-2 shadow-2xl"
        >
          {/* Property Type Tabs */}
          <div className="flex gap-1 p-1 mb-2">
            {PROPERTY_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setPropertyType(type.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  propertyType === type.value
                    ? 'brand-gradient text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{type.emoji}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Main Search Row */}
          <div className="flex flex-col lg:flex-row gap-2 p-2">
            {/* Location Input */}
            <div className="relative flex-1">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-2xl px-4 py-3.5 border border-white/20 focus-within:ring-2 ring-[var(--primary)]">
                <MapPin className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Location</div>
                  <input
                    ref={locationRef}
                    type="text"
                    value={location}
                    onChange={e => handleLocationInput(e.target.value)}
                    onFocus={() => location.length > 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="City, college, or company..."
                    className="w-full bg-transparent text-gray-800 dark:text-white placeholder-gray-400 outline-none text-sm font-medium"
                  />
                </div>
                <button
                  onClick={useCurrentLocation}
                  className="text-xs text-[var(--primary)] font-medium whitespace-nowrap hover:opacity-80"
                >
                  Near me
                </button>
              </div>

              {/* Location Suggestions */}
              <AnimatePresence>
                {showSuggestions && locationSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
                  >
                    {locationSuggestions.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocation(city)
                          setShowSuggestions(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-[var(--primary)]" />
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Gender */}
            <div className="relative">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-2xl px-4 py-3.5 border border-white/20">
                <Users className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">For</div>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="bg-transparent text-gray-800 dark:text-white outline-none text-sm font-medium pr-6 cursor-pointer"
                  >
                    {GENDER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="relative">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-2xl px-4 py-3.5 border border-white/20">
                <span className="text-[var(--primary)] font-bold text-lg flex-shrink-0">₹</span>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Budget</div>
                  <select
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="bg-transparent text-gray-800 dark:text-white outline-none text-sm font-medium pr-6 cursor-pointer"
                  >
                    {BUDGET_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <motion.button
              onClick={handleSearch}
              disabled={isSearching}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="brand-gradient text-white px-8 py-3.5 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSearching ? (
                <div className="spinner w-5 h-5 border-white border-t-transparent" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </motion.button>
          </div>

          {/* Amenity Quick Filters */}
          <div className="px-2 pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors mb-2"
            >
              <Filter className="w-3.5 h-3.5" />
              More filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2">
                    {amenityList.map(item => (
                      <button
                        key={item.key}
                        onClick={() => toggleAmenity(item.key as keyof typeof amenities)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          amenities[item.key as keyof typeof amenities]
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        <span>{item.emoji}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Popular Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mt-6"
        >
          <span className="text-white/50 text-sm">Popular:</span>
          {POPULAR_SEARCHES.map(search => (
            <button
              key={search}
              onClick={() => {
                const city = search.split(' in ')[1] || search.split(' near ')[0]
                setLocation(city)
                handleSearch()
              }}
              className="text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all"
            >
              {search}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}
