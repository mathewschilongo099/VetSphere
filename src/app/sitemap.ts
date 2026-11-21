import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latest = posts[0] ? new Date(posts[0].date) : new Date();

  const articleUrls = posts.map((post) => ({
    url: `${SITE_URL}/articles/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  const staticPages = [
    { path: '', date: latest },
    { path: '/articles', date: latest },
    { path: '/about', date: latest },
    { path: '/services', date: latest },
    { path: '/contact', date: latest },
    { path: '/ask', date: latest },
    { path: '/quiz', date: latest },
    { path: '/privacy-policy', date: latest },
    { path: '/terms', date: latest },
    { path: '/disclaimer', date: latest },
  ].map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: p.date }));

  return [...staticPages, ...articleUrls];
}
