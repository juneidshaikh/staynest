'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import toast from 'react-hot-toast'

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
]

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { signup } = useAuthStore()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    referralCode: searchParams.get('ref') || '',
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-green-500']
  const strengthLabels = ['Weak', 'Fair', 'Strong']

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.email && !form.phone) { toast.error('Email or phone is required'); return }
    if (!form.password) { toast.error('Password is required'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (passwordStrength < 2) { toast.error('Please use a stronger password'); return }
    if (!form.agreeToTerms) { toast.error('Please accept the Terms of Service'); return }

    setIsLoading(true)
    try {
      await signup({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
        gender: form.gender || undefined,
      })
      toast.success('Welcome to StayNest! 🎉')
      router.push(redirect)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-[var(--secondary)] opacity-5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-[var(--primary)] opacity-5 blur-3xl rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-[var(--text-primary)]">
              Stay<span className="text-[var(--primary)]">Nest</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-6">Create your account</h1>
          <p className="text-[var(--text-secondary)] mt-1">Find your perfect PG or hostel</p>
        </div>

        <div className="bg-[var(--surface)] rounded-3xl shadow-[var(--shadow-xl)] p-8 border border-[var(--border)]">
          {/* Google Signup */}
          <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-sm transition-all mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-tertiary)] font-medium">OR</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Your full name"
                required
                className="custom-input"
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="custom-input"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+91 98765..."
                  className="custom-input"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] -mt-2">At least one of email or phone is required</p>

            {/* Gender */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Gender</label>
              <select
                value={form.gender}
                onChange={e => handleChange('gender', e.target.value)}
                className="custom-input"
              >
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="custom-input pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-[var(--border)]'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength === 3 ? 'text-green-500' : passwordStrength === 2 ? 'text-orange-500' : 'text-red-500'}`}>
                    {form.password ? strengthLabels[passwordStrength - 1] || 'Too weak' : ''}
                  </p>
                  <div className="space-y-0.5">
                    {PASSWORD_RULES.map((rule, i) => (
                      <div key={i} className={`flex items-center gap-1.5 text-xs ${rule.test(form.password) ? 'text-green-500' : 'text-[var(--text-tertiary)]'}`}>
                        <Check className="w-3 h-3" />
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Confirm Password *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                placeholder="Repeat your password"
                required
                className={`custom-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500' : ''}`}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Referral Code (optional)</label>
              <input
                type="text"
                value={form.referralCode}
                onChange={e => handleChange('referralCode', e.target.value.toUpperCase())}
                placeholder="SNXXXXXXXX"
                className="custom-input"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => handleChange('agreeToTerms', !form.agreeToTerms)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form.agreeToTerms ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}
              >
                {form.agreeToTerms && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                I agree to StayNest&apos;s{' '}
                <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl brand-gradient text-white font-bold text-base shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[var(--primary)] font-semibold hover:opacity-80">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
