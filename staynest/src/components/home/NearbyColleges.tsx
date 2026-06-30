'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown, GraduationCap, Building2 } from 'lucide-react'

const COLLEGES = [
  { name: 'IIT Delhi', city: 'Delhi', type: 'college', count: 340 },
  { name: 'IIM Bangalore', city: 'Bangalore', type: 'college', count: 220 },
  { name: 'Manipal University', city: 'Manipal', type: 'college', count: 480 },
  { name: 'BITS Pilani', city: 'Pilani', type: 'college', count: 190 },
  { name: 'VIT Vellore', city: 'Vellore', type: 'college', count: 560 },
  { name: 'NMIMS Mumbai', city: 'Mumbai', type: 'college', count: 310 },
  { name: 'SRM Chennai', city: 'Chennai', type: 'college', count: 420 },
  { name: 'Amity Noida', city: 'Noida', type: 'college', count: 380 },
]

const COMPANIES = [
  { name: 'Infosys', city: 'Bangalore', type: 'company', count: 890 },
  { name: 'TCS', city: 'Mumbai', type: 'company', count: 720 },
  { name: 'Wipro', city: 'Hyderabad', type: 'company', count: 540 },
  { name: 'Accenture', city: 'Pune', type: 'company', count: 460 },
  { name: 'HCL', city: 'Noida', type: 'company', count: 380 },
  { name: 'Cognizant', city: 'Chennai', type: 'company', count: 310 },
  { name: 'Tech Mahindra', city: 'Pune', type: 'company', count: 270 },
  { name: 'IBM', city: 'Bangalore', type: 'company', count: 490 },
]

export function NearbyColleges() {
  const [activeTab, setActiveTab] = useState<'college' | 'company'>('college')
  const items = activeTab === 'college' ? COLLEGES : COMPANIES

  return (
    <section className="py-20 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Near You</p>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">Find PGs Near Your</h2>
          <div className="flex justify-center gap-3 mt-4">
            {(['college', 'company'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${activeTab === tab ? 'brand-gradient text-white shadow-md' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
              >
                {tab === 'college' ? <GraduationCap className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                {tab === 'college' ? 'College' : 'Workplace'}
              </button>
            ))}
          </div>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link href={`/search?city=${item.city}&near=${encodeURIComponent(item.name)}`}>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer group">
                  <div className="text-2xl mb-2">{item.type === 'college' ? '🎓' : '🏢'}</div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-[var(--primary)] transition-colors">{item.name}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{item.city}</p>
                  <p className="text-xs text-[var(--primary)] font-medium mt-2">{item.count}+ PGs nearby</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ===========================
// FAQ Section
// ===========================

const FAQS = [
  { q: 'Is StayNest free to use?', a: 'Yes! StayNest is completely free for guests to search and browse properties. A small platform fee is added at checkout, which covers our verification, customer support, and payment security services.' },
  { q: 'How does StayNest verify properties?', a: 'Our verification team physically visits properties, checks documents, verifies owner identity, and ensures the listing matches reality. Verified properties are marked with a green "Verified" badge.' },
  { q: 'Can I get a refund if I cancel my booking?', a: 'Yes, our cancellation policy varies by property. Most properties offer free cancellation up to 7 days before check-in. You can see the specific cancellation policy on each property page before booking.' },
  { q: 'How do I pay? Is it secure?', a: 'We support all major payment methods: Credit/Debit Cards, UPI, Net Banking, Google Pay, PhonePe, Paytm, Wallets, and more. All transactions are secured with 256-bit SSL encryption.' },
  { q: 'Can I book for my friend?', a: 'Yes! You can book on behalf of someone else. Just enter their details during the booking process. The booking confirmation will be sent to your email.' },
  { q: 'What if the property isn\'t as shown?', a: 'We have a 24-hour check-in guarantee. If your accommodation doesn\'t match the listing, contact us within 24 hours of check-in and we\'ll either resolve the issue or find you alternative accommodation and issue a full refund.' },
  { q: 'How do I list my property on StayNest?', a: 'Click "List your property" in the top navigation. Register as an owner, add your property details, upload photos, and submit for verification. Once verified, your property goes live within 2 working days.' },
  { q: 'Is there a minimum stay requirement?', a: 'Most PGs and hostels have a minimum stay of 1 month. Some co-living spaces may accept shorter stays. The minimum stay is clearly mentioned on each property\'s listing page.' },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 bg-[var(--bg-secondary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-2">Got Questions?</p>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-[var(--text-primary)]">Frequently Asked Questions</h2>
        </motion.div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-[var(--text-primary)] text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-[var(--text-secondary)] text-sm">Still have questions?</p>
          <Link href="/support" className="inline-flex mt-3 items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-semibold hover:opacity-90 transition-opacity">
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  )
}
