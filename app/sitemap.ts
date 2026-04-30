import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vidyabot.in';

  // In a real app, you would fetch these from your database/topics.json
  const staticRoutes = [
    '',
    '/info',
    '/login',
    '/tools/climate-agriculture',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Example programmatic routes - these will be populated from topics.json later
  const topics = [
    'quantum-mechanics',
    'photosynthesis',
    'organic-chemistry',
    'indian-constitution',
  ];

  const topicRoutes = topics.map((topic) => ({
    url: `${baseUrl}/learn/${topic}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...topicRoutes];
}
