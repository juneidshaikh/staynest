'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Mail, Phone, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import axios from 'axios'
import toast from 'react-hot-toast'

type LoginMode = 'password' | 'otp'
type ContactMethod = 'email' | 'phone'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login, loginWithGoogle } = useAuthStore()

  const [mode, setMode] = useState<LoginMode>('password')
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)

  const contact = contactMethod === 'email' ? email : phone

  const startOtpTimer = () => {
    setOtpTimer(60)
    const interval = setInterval(() => {
      setOtpTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const handleSendOtp = async () => {
    if (!contact) {
      toast.error(`Please enter your ${contactMethod}`)
      return
    }
    setOtpLoading(true)
    try {
      await axios.post('/api/auth/otp', {
        [contactMethod]: contact,
        purpose: 'login',
      })
      setOtpSent(true)
      startOtpTimer()
      toast.success(`OTP sent to ${contact}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) {
      toast.error(`Please enter your ${contactMethod}`)
      return
    }
    setIsLoading(true)
    try {
      await login({
        email: contactMethod === 'email' ? email : undefined,
        phone: contactMethod === 'phone' ? phone : undefined,
        password: mode === 'password' ? password : undefined,
        otp: mode === 'otp' ? otp : undefined,
      })
      toast.success('Welcome back! 👋')
      router.push(redirect)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // In production, use Google OAuth flow
    // For demo, we redirect to Google OAuth
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('Google login not configured')
      return
    }
    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const scope = 'openid email profile'
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}`
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--primary)] opacity-5 blur-3xl rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-[var(--text-primary)]">
              Stay<span className="text-[var(--primary)]">Nest</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-6">Welcome back</h1>
          <p className="text-[var(--text-secondary)] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-[var(--surface)] rounded-3xl shadow-[var(--shadow-xl)] p-8 border border-[var(--border)]">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-sm transition-all hover:shadow-md mb-6"
          >
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

          {/* Login Mode Toggle */}
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl mb-5">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'password' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              Password
            </button>
            <button
              onClick={() => setMode('otp')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'otp' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              OTP
            </button>
          </div>

          {/* Contact Method Toggle */}
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl mb-5">
            <button
              onClick={() => setContactMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${contactMethod === 'email' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              onClick={() => setContactMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${contactMethod === 'phone' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              <Phone className="w-4 h-4" /> Phone
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email/Phone Input */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">
                {contactMethod === 'email' ? 'Email address' : 'Phone number'}
              </label>
              {contactMethod === 'email' ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="custom-input"
                />
              ) : (
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="custom-input"
                />
              )}
            </div>

            {/* Password Input */}
            {mode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[var(--text-secondary)]">Password</label>
                  <Link href="/forgot-password" className="text-sm text-[var(--primary)] hover:opacity-80">Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="custom-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Input */}
            {mode === 'otp' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !contact}
                    className="w-full py-3 rounded-2xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold text-sm hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-50"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send OTP'}
                  </button>
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 block">Enter 6-digit OTP</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="custom-input text-center text-xl tracking-widest font-bold flex-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpTimer > 0 || otpLoading}
                      className="text-sm text-[var(--primary)] mt-2 disabled:text-[var(--text-tertiary)]"
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || (mode === 'otp' && !otpSent)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl brand-gradient text-white font-bold text-base shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Don&apos;t have an account?{' '}
            <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="text-[var(--primary)] font-semibold hover:opacity-80">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
