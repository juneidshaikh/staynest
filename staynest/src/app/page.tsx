import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { TrendingCities } from '@/components/home/TrendingCities'
import { FeaturedProperties } from '@/components/home/FeaturedProperties'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Testimonials } from '@/components/home/Testimonials'
import { SpecialOffers } from '@/components/home/SpecialOffers'
import { NearbyColleges } from '@/components/home/NearbyColleges'
import { FAQSection } from '@/components/home/FAQSection'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'StayNest – Find PGs, Hostels & Co-living Spaces Near You',
  description: 'Find and book verified PGs, hostels, co-living spaces, and student accommodations across India. Best prices, real reviews, instant booking.',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrendingCities />
        <FeaturedProperties />
        <HowItWorks />
        <SpecialOffers />
        <NearbyColleges />
        <Testimonials />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}
