'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const CITIES = [
  { name: 'Bangalore', state: 'Karnataka', count: '8,200+', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=300&fit=crop', emoji: '🌿' },
  { name: 'Mumbai', state: 'Maharashtra', count: '6,500+', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=300&fit=crop', emoji: '🌊' },
  { name: 'Delhi', state: 'NCR', count: '7,100+', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop', emoji: '🏛️' },
  { name: 'Hyderabad', state: 'Telangana', count: '4,800+', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', emoji: '💎' },
  { name: 'Pune', state: 'Maharashtra', count: '5,200+', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', emoji: '🎓' },
  { name: 'Chennai', state: 'Tamil Nadu', count: '3,600+', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop', emoji: '🌅' },
  { name: 'Kolkata', state: 'West Bengal', count: '2,900+', image: 'https://images.unsplash.com/photo-1558618047-f4e90f8fec37?w=400&h=300&fit=crop', emoji: '🎭' },
  { name: 'Noida', state: 'UP', count: '3,100+', image: 'https://images.unsplash.com/photo-1615869442320-fd02a129c77c?w=400&h=300&fit=crop', emoji: '🏢' },
]

export function TrendingCities() {
  return (
    <section className="py-20 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Explore Cities</p>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">
              Trending Destinations
            </h2>
            <p className="text-[var(--text-secondary)] mt-2">Find PGs and hostels in India&apos;s top cities</p>
          </div>
          <Link href="/search" className="hidden md:flex items-center gap-2 text-[var(--primary)] font-semibold hover:opacity-80 transition-opacity">
            View all cities →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CITIES.map((city, i) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <Link href={`/search?city=${city.name}`}>
                <div className="group relative rounded-2xl overflow-hidden cursor-pointer hover-lift">
                  <div className="relative h-44 sm:h-48">
                    <Image
                      src={city.image}
                      alt={city.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{city.emoji}</span>
                      <h3 className="text-white font-bold text-lg leading-tight">{city.name}</h3>
                    </div>
                    <p className="text-white/70 text-xs">{city.state}</p>
                    <div className="mt-2 inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      {city.count} PGs
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/search" className="text-[var(--primary)] font-semibold">
            View all cities →
          </Link>
        </div>
      </div>
    </section>
  )
}
