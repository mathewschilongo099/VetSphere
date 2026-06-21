import { getAllPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';
import AnimalSearch from '@/components/AnimalSearch';

export default async function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="relative bg-gray-900 text-white w-full py-16 sm:py-20 overflow-hidden">
        {/* Subtle ambient texture — radial glow + faint grid, no images needed */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.18), transparent 45%), radial-gradient(circle at 80% 0%, rgba(34,197,94,0.10), transparent 40%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 flex flex-col items-center">
          <div className="flex-1 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
              Better Animal Health <br className="hidden sm:block" />
              <span className="text-green-400">Starts Here</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg mb-7 max-w-2xl mx-auto leading-relaxed">
              Practical veterinary guides for livestock farmers, students, and pet owners. Learn animal health, nutrition, disease prevention, and farm management through easy-to-understand articles written by professionals.
            </p>

            {/* Ask feature — promoted as the primary action, since it's a real, working tool */}
            <div className="max-w-xl mx-auto mb-6">
              <div className="bg-white/5 border border-white/15 rounded-2xl p-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                  <span className="text-green-400 text-xs font-bold uppercase tracking-wide">Ask VetSphere</span>
                  <span className="text-gray-400 text-xs">— get an instant answer</span>
                </div>
                <AnimalSearch />
              </div>
            </div>

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

      {/* Trust / category strip — gives scope at a glance right under the hero */}
      <section className="w-full bg-gray-950 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
          <span className="flex items-center gap-2"><span className="text-green-400">●</span> Livestock Health</span>
          <span className="flex items-center gap-2"><span className="text-green-400">●</span> Pet Care</span>
          <span className="flex items-center gap-2"><span className="text-green-400">●</span> Disease Prevention</span>
          <span className="flex items-center gap-2"><span className="text-green-400">●</span> New articles published daily</span>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="w-full py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Latest Articles</h2>
              <p className="text-gray-500 mt-2">Fresh veterinary knowledge published daily</p>
            </div>
            <a href="/articles" className="text-green-600 font-semibold text-sm hover:underline shrink-0">View all</a>
          </div>
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map(post => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16">No articles yet. Check back soon.</p>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">What You Will Find Here</h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">VetSphere covers the topics that matter most to farmers, students, and pet owners.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
              <div className="text-4xl mb-4">🐄</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Livestock Health</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Guides on cattle, goats, poultry and pigs covering disease prevention, feeding, breeding and daily farm management.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
              <div className="text-4xl mb-4">🐾</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Pet Care</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Straightforward advice for dog and cat owners on health, vaccinations, nutrition and common conditions to watch out for.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Disease Prevention</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Learn how to identify early signs of illness, set up proper biosecurity, and keep your animals healthy before problems start.</p>
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
            <a href="/articles" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition text-center">Read Articles</a>
            <a href="/contact" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-center">Contact Us</a>
          </div>
        </div>
      </section>

    </div>
  );
}
