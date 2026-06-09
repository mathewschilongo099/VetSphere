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

      {/* Hero */}
      <section className="bg-gray-900 text-white py-20 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            Knowledge Base
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">All Articles</h1>
          <p className="text-gray-400 text-base sm:text-xl">
            Browse our full library of veterinary knowledge — free for everyone.
          </p>
        </div>
      </section>

      {/* Search + Articles — client component */}
      <ArticleSearch initialPosts={posts} />

    </div>
  );
}
