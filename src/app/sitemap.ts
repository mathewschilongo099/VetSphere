import { getAllPosts } from '@/lib/blog';

export default function sitemap() {
  const posts = getAllPosts();
  const baseUrl = 'https://vetsphere.cc.cd';

  const articleUrls = posts.map((post) => ({
    url: `${baseUrl}/articles/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  const latest = posts[0] ? new Date(posts[0].date) : new Date();
  const legalDate = new Date('2026-11-21');

  return [
    { url: baseUrl, lastModified: latest },
    { url: `${baseUrl}/articles`, lastModified: latest },
    { url: `${baseUrl}/ask`, lastModified: latest },
    { url: `${baseUrl}/quiz`, lastModified: latest },
    { url: `${baseUrl}/about`, lastModified: legalDate },
    { url: `${baseUrl}/contact`, lastModified: legalDate },
    { url: `${baseUrl}/privacy-policy`, lastModified: legalDate },
    { url: `${baseUrl}/terms`, lastModified: legalDate },
    { url: `${baseUrl}/disclaimer`, lastModified: legalDate },
    ...articleUrls,
  ];
}
