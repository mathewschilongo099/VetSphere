import { getFeaturedPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';

export default async function HomePage() {
  const featuredPosts = getFeaturedPosts(3);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white w-full py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
              Trusted Veterinary Knowledge
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Better Animal Health <br className="hidden sm:block" />
              <span className="text-green-400">Starts Here</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-xl mx-auto lg:mx-0">
              Expert veterinary articles for African farmers and pet owners — practical, reliable, and completely free.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a href="/articles" className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition text-center">
                Explore Articles
              </a>
              <a href="/contact" className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition text-center border border-white/20">
                Get in Touch
              </a>
            </div>
          </div>

          {/* Stats Card */}
          <div className="flex-shrink-0 bg-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-xs mx-auto lg:mx-0 border border-gray-700">
            <p className="text-gray-400 text-sm mb-6 font-medium">VetSphere Africa at a glance</p>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📰</span>
                <div>
                  <p className="text-2xl font-extrabold text-white">Growing</p>
                  <p className="text-gray-400 text-sm">Article Library</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl">🐄</span>
                <div>
                  <p className="text-2xl font-extrabold text-white">5+</p>
                  <p className="text-gray-400 text-sm">Topics Covered</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl">🌍</span>
                <div>
                  <p className="text-2xl font-extrabold text-white">Africa</p>
                  <p className="text-gray-400 text-sm">Focused Content</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-green-600 text-white py-4 w-full">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 text-sm font-medium text-center">
          <span>✅ Veterinary Accuracy</span>
          <span>✅ Free to Read</span>
          <span>✅ Livestock & Pets</span>
          <span>✅ African Conditions</span>
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
              Browse All Articles →
            </a>
          </div>
        </div>
      </section>

      {/* Why VetSphere */}
      <section className="w-full py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Why VetSphere?</h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">Everything you need to keep your animals healthy, in one place.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🐄', title: 'Livestock Focus', desc: 'Practical advice for cattle, goats, poultry and more — tailored for African conditions.' },
              { icon: '🐾', title: 'Pet Care', desc: 'Trusted guidance for dogs, cats and small animals to keep your pets healthy and happy.' },
              { icon: '💡', title: 'Expert Knowledge', desc: 'All articles written with veterinary accuracy in easy to understand language.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="w-full bg-green-600 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Have a question about your animals?</h2>
          <p className="text-green-100 mb-8 text-base sm:text-lg">Browse our articles or get in touch with us directly.</p>
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
