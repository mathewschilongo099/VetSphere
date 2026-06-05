import { getAllPosts, getPostsByCategory } from '@/lib/blog';
import { ArticleCard } from '@/components/content/ArticleCard';

export const metadata = {
  title: 'Blog Articles | VetSphere Africa',
  description: 'Explore our comprehensive collection of veterinary and livestock articles',
};

export default function ArticlesPage() {
  const posts = getAllPosts();

  return (
    <div className="container py-12 md:py-20">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Articles</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore our collection of expert veterinary articles, farming guides, and animal health tips.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-lg text-gray-600 dark:text-gray-400">No articles found yet.</p>
        </div>
      )}
    </div>
  );
}
