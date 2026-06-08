import { getAllPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';

export default async function ArticlesPage() {
  const posts = getAllPosts();
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-emerald-600 text-white py-16 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">All Articles</h1>
          <p className="text-green-100 text-base sm:text-xl">Browse our full library of veterinary knowledge.</p>
        </div>
      </section>

      {/* Articles */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-20 text-lg">No articles yet. Check back soon!</p>
        )}
      </section>

    </div>
  );
}
