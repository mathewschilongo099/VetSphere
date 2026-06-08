import { getAllPosts } from '@/lib/blog';

export default function sitemap() {
  const posts = getAllPosts();
  const baseUrl = 'https://vet-sphere.vercel.app';

  const articleUrls = posts.map((post) => ({
    url: `${baseUrl}/articles/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    ...articleUrls,
  ];
}
