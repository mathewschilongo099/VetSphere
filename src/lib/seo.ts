
export function generateArticleSchema(post: {
  title: string;
  description?: string;
  slug: string;
  date?: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description ?? "",
    datePublished: post.date ?? new Date().toISOString(),
    author: {
      "@type": "Person",
      name: post.author ?? "Author",
    },
    url: `https://vetsphere.cc.cd/blog/${post.slug}`,
  };
}
