import { MetadataRoute } from 'next';
import topics from '@/data/seo/topics.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vidyabot.in';

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/info`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/climate-agriculture`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  const topicRoutes = topics.map((topic) => ({
    url: `${baseUrl}/learn/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...topicRoutes];
}
