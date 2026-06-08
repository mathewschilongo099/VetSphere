import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getFeaturedPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';

export default async function HomePage() {
  const featuredPosts = getFeaturedPosts(6);

  return (
    <div>
      <Header />
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 to-green-700 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold mb-6">VetSphere Africa</h1>
          <p className="text-2xl mb-10">Trusted Veterinary Knowledge for Better Animal Health</p>
          <div className="flex justify-center gap-4">
            <a href="/articles" className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg">Explore Articles</a>
            <a href="/contact" className="border-2 border-white px-8 py-4 rounded-xl font-semibold text-lg">Get in Touch</a>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Featured Articles</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {featuredPosts.map(post => <ArticleCard key={post.slug} post={post} />)}
        </div>
        <div className="text-center mt-12">
          <a href="/articles" className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg">View All Articles</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
