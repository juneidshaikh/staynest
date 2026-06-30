'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Twitter, Instagram, Linkedin, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const FOOTER_LINKS = {
  'Explore': [
    { href: '/search', label: 'Search Properties' },
    { href: '/search?propertyType=PG', label: 'PGs' },
    { href: '/search?propertyType=HOSTEL', label: 'Hostels' },
    { href: '/search?propertyType=CO_LIVING', label: 'Co-living Spaces' },
    { href: '/search?propertyType=STUDENT_ACCOMMODATION', label: 'Student Housing' },
    { href: '/offers', label: 'Special Offers' },
  ],
  'For Owners': [
    { href: '/owner/register', label: 'List Your Property' },
    { href: '/owner/dashboard', label: 'Owner Dashboard' },
    { href: '/owner/pricing', label: 'Pricing Plans' },
    { href: '/owner/resources', label: 'Resources' },
    { href: '/owner/affiliate', label: 'Affiliate Program' },
  ],
  'Support': [
    { href: '/help', label: 'Help Center' },
    { href: '/support', label: 'Contact Support' },
    { href: '/safety', label: 'Safety Tips' },
    { href: '/report', label: 'Report an Issue' },
    { href: '/feedback', label: 'Give Feedback' },
  ],
  'Company': [
    { href: '/about', label: 'About Us' },
    { href: '/careers', label: 'Careers' },
    { href: '/press', label: 'Press' },
    { href: '/blog', label: 'Blog' },
    { href: '/investors', label: 'Investors' },
  ],
}

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Noida', 'Gurgaon', 'Ahmedabad']

export function Footer() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)]">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-[var(--text-primary)]">
                Stay<span className="text-[var(--primary)]">Nest</span>
              </span>
            </Link>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 max-w-xs">
              India&apos;s most trusted platform for PGs, Hostels, Co-living Spaces, and Student Accommodations. Find your perfect home away from home.
            </p>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <a href="mailto:support@staynest.com" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                <Mail className="w-4 h-4" /> support@staynest.com
              </a>
              <a href="tel:+918001234567" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
                <Phone className="w-4 h-4" /> +91 800 123 4567
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Bangalore, India
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: Twitter, href: 'https://twitter.com' },
                { Icon: Instagram, href: 'https://instagram.com' },
                { Icon: Facebook, href: 'https://facebook.com' },
                { Icon: Linkedin, href: 'https://linkedin.com' },
                { Icon: Youtube, href: 'https://youtube.com' },
              ].map(({ Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-[var(--text-primary)] text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular Cities */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <h4 className="font-bold text-[var(--text-primary)] text-sm mb-4">Popular Cities</h4>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(city => (
              <Link key={city} href={`/search?city=${city}`}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] bg-[var(--bg-secondary)] hover:bg-[var(--primary)]/10 px-3 py-1.5 rounded-full transition-all">
                PG in {city}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            © 2024 StayNest Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms', label: 'Terms of Service' },
              { href: '/cookies', label: 'Cookie Policy' },
              { href: '/sitemap', label: 'Sitemap' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
