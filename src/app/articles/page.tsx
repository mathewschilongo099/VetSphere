import { getAllPosts } from '@/lib/blog';
import ArticleSearch from '@/components/content/ArticleSearch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Articles | VetSphere',
  description: 'Browse our full library of free veterinary articles covering livestock health, pet care, disease prevention and more.',
};

export default function ArticlesPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {/* Heading kept for SEO and screen readers, hidden visually */}
      <h1 className="sr-only">All Articles</h1>

      {/* Search + Articles — client component */}
      <ArticleSearch initialPosts={posts} />
    </div>
  );
}
