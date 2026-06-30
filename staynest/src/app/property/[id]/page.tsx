import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PropertyDetailClient } from './PropertyDetailClient'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await prisma.property.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }], status: 'ACTIVE' },
    select: { name: true, description: true, coverImage: true, city: true, state: true, metaTitle: true, metaDescription: true },
  })

  if (!property) return { title: 'Property Not Found' }

  return {
    title: property.metaTitle || `${property.name} – PG in ${property.city}`,
    description: property.metaDescription || property.description.slice(0, 160),
    openGraph: {
      title: property.name,
      description: property.description.slice(0, 160),
      images: property.coverImage ? [{ url: property.coverImage }] : [],
    },
  }
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await prisma.property.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }], status: 'ACTIVE' },
    select: { id: true },
  })

  if (!property) notFound()

  return (
    <>
      <Navbar />
      <PropertyDetailClient propertyId={property.id} />
      <Footer />
    </>
  )
}
