import { getAllPosts, getFeaturedPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';
import AnimalSearch from '@/components/AnimalSearch';

export default async function HomePage() {
  // Show articles marked `featured: true` in their front matter.
  // If none are marked yet, fall back to the three newest articles.
  const featured = getFeaturedPosts(3);
  const featuredPosts = featured.length > 0 ? featured : getAllPosts().slice(0, 3);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero (compact) */}
      <section className="relative bg-gray-900 text-white w-full py-6 sm:py-12 overflow-hidden">
        {/* Subtle ambient texture: radial glow + faint grid, no images needed */}
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
          <div className="flex-1 text-center w-full">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-2">
              Better Animal Health <span className="text-green-400">Starts Here</span>
            </h1>
            <p className="text-gray-300 text-xs sm:text-base mb-3 max-w-2xl mx-auto leading-snug">
              Practical veterinary guides for farmers, students, and pet owners.
            </p>

            {/* Ask feature */}
            <div className="max-w-xl mx-auto">
              <div className="bg-white/5 border border-white/15 rounded-2xl p-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 px-2.5 pt-1 pb-1">
                  <span className="text-green-400 text-[11px] font-bold uppercase tracking-wide">Ask VetAssist</span>
                  <span className="text-gray-400 text-[11px]">— AI-powered answers</span>
                </div>
                <AnimalSearch />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="w-full py-6 sm:py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 mb-4">Featured Articles</h2>
          {featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredPosts.map((post, index) => (
                <ArticleCard key={post.slug} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-10">No articles yet. Check back soon.</p>
          )}
          <div className="text-center mt-6">
            <a href="/articles" className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition">
              Browse All Articles
            </a>
          </div>
        </div>
      </section>

      {/* Topics (compact) */}
      <section className="w-full py-6 sm:py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-5">
              <div className="text-2xl sm:text-3xl mb-1">🐄</div>
              <h3 className="font-bold text-xs sm:text-base text-gray-900">Livestock Health</h3>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-5">
              <div className="text-2xl sm:text-3xl mb-1">🐾</div>
              <h3 className="font-bold text-xs sm:text-base text-gray-900">Pet Care</h3>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 sm:p-5">
              <div className="text-2xl sm:text-3xl mb-1">💡</div>
              <h3 className="font-bold text-xs sm:text-base text-gray-900">Disease Prevention</h3>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-5 max-w-xl mx-auto">
            VetSphere shares general educational information. It is not a substitute for advice from a qualified veterinarian.{' '}
            <a href="/disclaimer" className="underline hover:text-green-600">Read the disclaimer</a>.
          </p>
        </div>
      </section>

    </div>
  );
}
