import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://staynest.com'

  const staticRoutes = [
    '', '/search', '/about', '/contact', '/help', '/privacy', '/terms',
    '/login', '/signup', '/owner/register',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  let propertyRoutes: MetadataRoute.Sitemap = []
  try {
    const properties = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
      take: 5000,
    })
    propertyRoutes = properties.map(p => ({
      url: `${baseUrl}/property/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // DB might not be available during build
  }

  return [...staticRoutes, ...propertyRoutes]
}
