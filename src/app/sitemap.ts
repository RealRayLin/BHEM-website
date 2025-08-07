import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bhem.ca'
  const lastModified = new Date()
  
  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/BHEM Brand Deck-Website.pdf`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ]
}
