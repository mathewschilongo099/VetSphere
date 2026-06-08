import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getAllPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';

export default async function ArticlesPage() {
  const posts = getAllPosts();
  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-center mb-12">All Articles</h1>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
