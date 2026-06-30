'use client'

import React from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  { step: '01', emoji: '🔍', title: 'Search', description: 'Enter your city, college, or company. Filter by budget, gender, amenities, and more.' },
  { step: '02', emoji: '🏠', title: 'Explore', description: 'Browse verified properties with photos, videos, 360° tours, and genuine reviews.' },
  { step: '03', emoji: '📅', title: 'Book Instantly', description: 'Book with one click. Pay securely online. Get instant confirmation.' },
  { step: '04', emoji: '🏡', title: 'Move In', description: 'Get all details on your phone. Move in hassle-free. Rate your stay.' },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-[var(--bg-secondary)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">How StayNest Works</h2>
          <p className="text-[var(--text-secondary)] mt-2 max-w-xl mx-auto">Find and book your perfect PG or hostel in just minutes</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="w-20 h-20 rounded-2xl brand-gradient mx-auto mb-5 flex items-center justify-center shadow-lg text-3xl">
                {step.emoji}
              </div>
              <div className="absolute top-0 right-1/4 text-6xl font-black text-[var(--border)] opacity-60 select-none leading-none">{step.step}</div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{step.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
