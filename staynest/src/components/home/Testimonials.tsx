'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Software Engineer, Bangalore', avatar: '👩‍💻', rating: 5, text: 'Found my perfect PG near my office in just 2 hours! The verified listings and real photos made it so easy. Saved months of broker headache.', city: 'Bangalore' },
  { name: 'Rahul Mehta', role: 'IIT Student, Delhi', avatar: '👨‍🎓', rating: 5, text: 'As a student from a small town, finding accommodation in Delhi was scary. StayNest made it super safe and transparent. Got a great hostel near campus!', city: 'Delhi' },
  { name: 'Ananya Patel', role: 'Working Professional, Pune', avatar: '👩‍🏫', rating: 5, text: 'The reviews are genuine and the instant booking feature is a lifesaver. Moved cities 3 times and always use StayNest. Never been disappointed!', city: 'Pune' },
  { name: 'Karan Singh', role: 'MBA Student, Mumbai', avatar: '👨‍💼', rating: 5, text: 'Amazing platform! Found a co-living space with my kind of crowd. The map feature helped me check distance from campus before booking.', city: 'Mumbai' },
  { name: 'Deepika Nair', role: 'Nurse, Chennai', avatar: '👩‍⚕️', rating: 4, text: 'As a woman professional, safety was my top concern. StayNest\'s verified women-only PGs gave me confidence. The customer support is excellent!', city: 'Chennai' },
  { name: 'Aditya Kumar', role: 'Startup Founder, Hyderabad', avatar: '🧑‍🚀', rating: 5, text: 'Co-living space I found on StayNest has been incredible for networking. Met my co-founder here! The AI recommendations are spot-on.', city: 'Hyderabad' },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Real Reviews</p>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">What Our Community Says</h2>
          <p className="text-[var(--text-secondary)] mt-2">Join 2 million+ happy guests who found their home with StayNest</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-[var(--primary)] opacity-20" />
              <div className="flex items-center gap-1 mb-4">
                {Array(5).fill(0).map((_, idx) => (
                  <Star key={idx} className={`w-4 h-4 ${idx < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border)]'}`} />
                ))}
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5 line-clamp-3">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-2xl">{t.avatar}</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-sm">{t.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
