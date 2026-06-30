'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Tag, Clock, Zap } from 'lucide-react'

const OFFERS = [
  { code: 'FIRST50', title: 'First Booking Offer', description: '50% off on your first month\'s booking. New users only.', discount: '50% OFF', color: 'from-[#FF385C] to-[#FF6B35]', validTill: 'Limited time', icon: '🎉' },
  { code: 'STUDENT25', title: 'Student Special', description: 'Exclusive 25% discount for students with valid ID.', discount: '25% OFF', color: 'from-[#7C3AED] to-[#00B4D8]', validTill: 'Ongoing', icon: '🎓' },
  { code: 'LONGSTAY', title: 'Long Stay Bonus', description: 'Stay 6+ months and get 1 month free. No brokerage.', discount: '1 Month FREE', color: 'from-[#059669] to-[#0891B2]', validTill: 'Always valid', icon: '🏡' },
]

export function SpecialOffers() {
  return (
    <section className="py-20 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Deals & Offers</p>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">Special Discounts</h2>
            <p className="text-[var(--text-secondary)] mt-2">Save big on your next stay</p>
          </div>
          <Link href="/offers" className="hidden md:block text-[var(--primary)] font-semibold hover:opacity-80">All offers →</Link>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFERS.map((offer, i) => (
            <motion.div
              key={offer.code}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-2xl text-white hover-lift cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${offer.color}`} />
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)' }} />
              <div className="relative p-6">
                <div className="text-4xl mb-3">{offer.icon}</div>
                <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold mb-3">
                  <Tag className="w-3 h-3" /> {offer.code}
                </div>
                <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                <p className="text-white/80 text-sm mb-4">{offer.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">{offer.discount}</span>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <Clock className="w-3 h-3" /> {offer.validTill}
                  </div>
                </div>
                <Link href={`/search?coupon=${offer.code}`}>
                  <button className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Apply Now
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
