import { getFeaturedPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';

export default async function HomePage() {
  const featuredPosts = getFeaturedPosts(6);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white py-20 w-full">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-500/30 text-green-100 text-xs font-medium px-4 py-1 rounded-full mb-6 tracking-widest uppercase">
            Trusted Veterinary Knowledge
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Better Animal Health <br className="hidden sm:block" />
            Starts Here
          </h1>
          <p className="text-base sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto px-2">
            Expert veterinary articles for African farmers and pet owners — practical, reliable, and free.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <a
              href="/articles"
              className="bg-white text-green-800 px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-green-50 transition text-center"
            >
              Explore Articles
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white/10 transition text-center"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-green-900 text-white py-6 w-full">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 text-center gap-2">
          <div>
            <p className="text-xl sm:text-2xl font-bold">50+</p>
            <p className="text-green-300 text-xs sm:text-sm">Articles</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold">10+</p>
            <p className="text-green-300 text-xs sm:text-sm">Topics Covered</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold">100%</p>
            <p className="text-green-300 text-xs sm:text-sm">Free to Read</p>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="w-full px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Featured Articles</h2>
            <p className="text-gray-500 text-base sm:text-lg">Handpicked reads for livestock and pet owners</p>
            <div className="w-16 h-1 bg-green-600 mx-auto mt-4 rounded-full"></div>
          </div>

          {featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map(post => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">No featured articles yet. Check back soon!</p>
          )}

          <div className="text-center mt-12">
            <a
              href="/articles"
              className="inline-block bg-green-700 hover:bg-green-800 text-white px-10 py-4 rounded-xl font-bold text-base sm:text-lg transition"
            >
              View All Articles →
            </a>
          </div>
        </div>
      </section>

      {/* Why VetSphere */}
      <section className="bg-green-50 py-16 w-full">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Why VetSphere?</h2>
          <div className="w-16 h-1 bg-green-600 mx-auto mb-10 rounded-full"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-4">🐄</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Livestock Focus</h3>
              <p className="text-gray-500 text-sm">Practical advice for cattle, goats, poultry and more — tailored for African conditions.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-4">🐾</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Pet Care</h3>
              <p className="text-gray-500 text-sm">Trusted guidance for dogs, cats and small animals to keep your pets healthy.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Expert Knowledge</h3>
              <p className="text-gray-500 text-sm">All articles are written with veterinary accuracy and easy to understand language.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
