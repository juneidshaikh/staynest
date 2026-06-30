'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Navbar } from '@/components/layout/Navbar'
import { ChevronLeft, ChevronRight, Upload, MapPin, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = ['Basic Info', 'Location', 'Pricing & Rules', 'Amenities', 'Photos']

const AMENITY_OPTIONS = [
  'wifi', 'ac', 'food', 'laundry', 'gym', 'parking', 'power_backup',
  'lift', 'study_room', 'cctv', 'security', 'balcony', 'pet_friendly', 'attached_bathroom'
]

export default function NewPropertyPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', propertyType: 'PG', gender: 'ANY',
    address: '', city: '', state: '', pincode: '', landmark: '',
    latitude: 0, longitude: 0,
    basePrice: '', securityDeposit: '', mealPlan: 'NONE',
    checkInTime: '10:00', checkOutTime: '11:00',
    minStayDays: '30', noticePeriodDays: '30',
    isInstantBook: false, noBrokerage: false,
    amenities: [] as string[],
    rules: [''],
  })

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }))
  }

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      update('latitude', pos.coords.latitude)
      update('longitude', pos.coords.longitude)
      toast.success('Location detected')
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { data } = await axios.post('/api/properties', {
        ...form,
        basePrice: Number(form.basePrice),
        securityDeposit: Number(form.securityDeposit) || 0,
        minStayDays: Number(form.minStayDays),
        noticePeriodDays: Number(form.noticePeriodDays),
        rules: form.rules.filter(r => r.trim()),
      })
      toast.success('Property submitted for review!')
      router.push('/owner/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create property')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return form.name.length >= 5 && form.description.length >= 50
      case 1: return form.address && form.city && form.state && form.pincode.length === 6
      case 2: return Number(form.basePrice) >= 500
      default: return true
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-2">List Your Property</h1>
          <p className="text-[var(--text-secondary)] mb-8">Fill in the details to get your property listed on StayNest</p>

          {/* Progress */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'brand-gradient text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] mt-1 hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-[var(--border)]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6"
          >
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Basic Information</h2>
                <div>
                  <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Property Name *</label>
                  <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Sunrise PG for Working Women" className="custom-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Property Type *</label>
                    <select value={form.propertyType} onChange={e => update('propertyType', e.target.value)} className="custom-input">
                      <option value="PG">PG</option>
                      <option value="HOSTEL">Hostel</option>
                      <option value="CO_LIVING">Co-living</option>
                      <option value="STUDENT_ACCOMMODATION">Student Accommodation</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Gender Preference *</label>
                    <select value={form.gender} onChange={e => update('gender', e.target.value)} className="custom-input">
                      <option value="ANY">Co-ed (Any)</option>
                      <option value="MALE">Male Only</option>
                      <option value="FEMALE">Female Only</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Description * (min 50 characters)</label>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5} placeholder="Describe your property, its features, the neighborhood..." className="custom-input resize-none" />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{form.description.length}/50 characters minimum</p>
                </div>
              </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Location</h2>
                <div>
                  <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Full Address *</label>
                  <input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Building name, street, area" className="custom-input" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="City *" className="custom-input" />
                  <input value={form.state} onChange={e => update('state', e.target.value)} placeholder="State *" className="custom-input" />
                  <input value={form.pincode} onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Pincode *" className="custom-input" />
                </div>
                <input value={form.landmark} onChange={e => update('landmark', e.target.value)} placeholder="Nearby landmark (optional)" className="custom-input" />
                <button onClick={detectLocation} type="button" className="flex items-center gap-2 text-sm text-[var(--primary)] font-medium">
                  <MapPin className="w-4 h-4" /> Detect my current location
                </button>
                {form.latitude !== 0 && (
                  <p className="text-xs text-green-600">✓ Location set: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p>
                )}
              </div>
            )}

            {/* Step 2: Pricing & Rules */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Pricing & Policies</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Base Price/Month (₹) *</label>
                    <input type="number" value={form.basePrice} onChange={e => update('basePrice', e.target.value)} placeholder="8000" className="custom-input" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Security Deposit (₹)</label>
                    <input type="number" value={form.securityDeposit} onChange={e => update('securityDeposit', e.target.value)} placeholder="10000" className="custom-input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Check-in Time</label>
                    <input type="time" value={form.checkInTime} onChange={e => update('checkInTime', e.target.value)} className="custom-input" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Check-out Time</label>
                    <input type="time" value={form.checkOutTime} onChange={e => update('checkOutTime', e.target.value)} className="custom-input" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Meal Plan</label>
                  <select value={form.mealPlan} onChange={e => update('mealPlan', e.target.value)} className="custom-input">
                    <option value="NONE">No meals</option>
                    <option value="BREAKFAST">Breakfast only</option>
                    <option value="HALF_BOARD">Half board (2 meals)</option>
                    <option value="FULL_BOARD">Full board (3 meals)</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isInstantBook} onChange={e => update('isInstantBook', e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--text-secondary)]">Enable Instant Booking</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.noBrokerage} onChange={e => update('noBrokerage', e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--text-secondary)]">No Brokerage</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Amenities */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AMENITY_OPTIONS.map(amenity => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                        form.amenities.includes(amenity) ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {form.amenities.includes(amenity) && <Check className="w-4 h-4" />}
                      {amenity.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Photos */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Photos & Review</h2>
                <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-10 text-center">
                  <Upload className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)] text-sm mb-1">Drag and drop photos here</p>
                  <p className="text-[var(--text-tertiary)] text-xs">You can add photos after submission too</p>
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                  <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-2">Review Summary</h4>
                  <div className="text-sm text-[var(--text-secondary)] space-y-1">
                    <p>{form.name}</p>
                    <p>{form.address}, {form.city}</p>
                    <p>₹{form.basePrice}/month • {form.amenities.length} amenities</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Your property will be reviewed by our team within 2 business days before going live.
                </p>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-semibold text-sm disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-semibold text-sm disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-semibold text-sm disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
