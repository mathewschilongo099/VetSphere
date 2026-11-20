const SITE_URL = 'https://vetsphere.cc.cd';

export function generateArticleSchema(post: {
  title: string;
  description?: string;
  slug: string;
  date?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description ?? '',
    datePublished: post.date ?? new Date().toISOString(),
    ...(post.image ? { image: post.image } : {}),
    author: {
      '@type': 'Person',
      name: post.author ?? 'VetSphere',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VetSphere',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/articles/${post.slug}`,
    url: `${SITE_URL}/articles/${post.slug}`,
  };
}
