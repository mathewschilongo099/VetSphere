import { getFeaturedPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';

export default async function HomePage() {
  const featuredPosts = getFeaturedPosts(3);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white w-full py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
          <div className="flex-1 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Better Animal Health <br className="hidden sm:block" />
              <span className="text-green-400">Starts Here</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Free veterinary articles for farmers and pet owners worldwide. Written to be practical, easy to understand, and actually useful.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/articles" className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition text-center">
                Explore Articles
              </a>
              <a href="/contact" className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition text-center border border-white/20">
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="w-full py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Featured Articles</h2>
              <p className="text-gray-500 mt-2">Handpicked reads for livestock and pet owners</p>
            </div>
            <a href="/articles" className="text-green-600 font-semibold text-sm hover:underline shrink-0">
              View all →
            </a>
          </div>

          {featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map(post => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16">No featured articles yet. Check back soon!</p>
          )}

          <div className="text-center mt-12">
            <a href="/articles" className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-bold transition">
              Browse All Articles
            </a>
          </div>
        </div>
      </section>

      {/* Why VetSphere */}
      <section className="w-full py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Why VetSphere?</h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">Everything you need to keep your animals healthy, all in one place.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
              <div className="text-4xl mb-4">🐄</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Livestock Health</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Practical guidance on cattle, goats, poultry and pigs. From disease prevention to feeding and breeding.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
              <div className="text-4xl mb-4">🐾</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Pet Care</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Reliable advice for dog and cat owners. Health tips, nutrition guides, and what to watch out for.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Expert Knowledge</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Articles written with veterinary accuracy in plain language anyone can understand and apply.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="w-full bg-green-600 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Have a question about your animals?</h2>
          <p className="text-green-100 mb-8 text-base sm:text-lg">Browse our articles or reach out and we will be happy to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/articles" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition text-center">
              Read Articles
            </a>
            <a href="/contact" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-center">
              Contact Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
