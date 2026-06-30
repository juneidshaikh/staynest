import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchPageClient } from './SearchPageClient'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Search PGs, Hostels & Co-living Spaces',
  description: 'Search and filter thousands of verified PGs, hostels, and co-living spaces across India.',
}

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg-secondary)]" />}>
        <SearchPageClient />
      </Suspense>
    </>
  )
}
