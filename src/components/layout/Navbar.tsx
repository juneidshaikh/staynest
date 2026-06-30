'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Menu, X, User, Heart, Bell, Home, 
  Globe, Moon, Sun, ChevronDown, LogOut, Settings,
  Bookmark, LayoutDashboard, HelpCircle
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import Image from 'next/image'
import toast from 'react-hot-toast'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const menuRef = useRef<HTMLDivElement>(null)

  const isHomePage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    setIsDark(theme === 'dark')
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handleLogout = async () => {
    await logout()
    setIsUserMenuOpen(false)
    toast.success('Logged out successfully')
    router.push('/')
  }

  const navLinks = [
    { href: '/search', label: 'Find PGs' },
    { href: '/search?propertyType=HOSTEL', label: 'Hostels' },
    { href: '/search?propertyType=CO_LIVING', label: 'Co-living' },
    { href: '/search?propertyType=STUDENT_ACCOMMODATION', label: 'Student Housing' },
  ]

  const transparent = isHomePage && !isScrolled

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'glass border-b border-[var(--border)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center shadow-lg">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className={`text-xl font-bold font-display ${transparent ? 'text-white' : 'text-[var(--text-primary)]'}`}>
              Stay<span className="text-[var(--primary)]">Nest</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  transparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* List Property Button */}
            <Link
              href={isAuthenticated ? '/owner/dashboard' : '/login?redirect=/owner/dashboard'}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              List your property
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <Link
                href="/notifications"
                className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                  transparent
                    ? 'text-white hover:bg-white/10'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-2xl border-2 transition-all duration-200 ${
                    transparent
                      ? 'border-white/30 hover:border-white/60'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''} ${transparent ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 glass rounded-2xl shadow-xl py-2 border border-[var(--glass-border)]"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <p className="font-semibold text-[var(--text-primary)]">{user?.name}</p>
                        <p className="text-sm text-[var(--text-secondary)] truncate">{user?.email}</p>
                      </div>

                      {[
                        { href: '/profile', icon: User, label: 'My Profile' },
                        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { href: '/wishlist', icon: Heart, label: 'Saved Properties' },
                        { href: '/bookings', icon: Bookmark, label: 'My Bookings' },
                        { href: '/notifications', icon: Bell, label: 'Notifications' },
                        { href: '/settings', icon: Settings, label: 'Settings' },
                        { href: '/support', icon: HelpCircle, label: 'Help & Support' },
                      ].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      ))}

                      {(user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                        <Link
                          href={user.role === 'OWNER' ? '/owner/dashboard' : '/admin/dashboard'}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {user.role === 'OWNER' ? 'Owner Dashboard' : 'Admin Panel'}
                        </Link>
                      )}

                      <div className="border-t border-[var(--border)] mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    transparent
                      ? 'text-white hover:bg-white/10'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold brand-gradient text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-200 ${
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-[var(--border)]"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={isAuthenticated ? '/owner/dashboard' : '/login'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-[var(--primary)] font-semibold hover:bg-[var(--bg-secondary)] transition-colors"
              >
                List your property
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
