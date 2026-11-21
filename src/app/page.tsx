import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import AnimalSearch from '@/components/AnimalSearch';

// Rebuild this page in the background every 10 minutes so the featured
// article can change on schedule without a new deployment.
export const revalidate = 600;

// How long each article stays featured before the next one takes over.
const FEATURED_HOURS = 10;
// When no (or only one) article is marked `featured: true`, rotate through this many newest articles.
const ROTATION_POOL_SIZE = 10;

export default async function HomePage() {
  const allPosts = getAllPosts();

  // Rotation pool: articles marked `featured: true` (from the admin dashboard).
  // If fewer than 2 are marked, rotate through the newest articles instead.
  const marked = allPosts.filter((p) => p.featured);
  const pool = marked.length >= 2 ? marked : allPosts.slice(0, ROTATION_POOL_SIZE);

  // Every FEATURED_HOURS the time slot increases by one, which moves to the next article.
  const slot = Math.floor(Date.now() / (FEATURED_HOURS * 60 * 60 * 1000));
  const featured = pool.length > 0 ? pool[slot % pool.length] : null;

  // Latest: newest articles, excluding the featured one. Shown as a compact list.
  const latestPosts = allPosts.filter((p) => !featured || p.slug !== featured.slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero (compact, green) */}
      <section className="relative bg-gradient-to-b from-green-600 to-green-700 text-white w-full py-5 sm:py-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.25), transparent 50%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 flex flex-col items-center">
          <div className="flex-1 text-center w-full">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-1.5">
              Better Animal Health <span className="text-lime-200">Starts Here</span>
            </h1>
            <p className="text-green-50 text-xs sm:text-base mb-3 max-w-2xl mx-auto leading-snug">
              Practical veterinary guides for farmers, students, and pet owners.
            </p>

            <div className="max-w-xl mx-auto">
              <div className="bg-white/10 border border-white/25 rounded-2xl p-2 sm:p-3">
                <div className="flex items-center gap-2 px-1 pb-1.5">
                  <span className="text-white text-[11px] font-bold uppercase tracking-wide">Ask VetAssist</span>
                  <span className="text-green-100 text-[11px]">— AI-powered answers</span>
                </div>
                <AnimalSearch compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-6 sm:py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">

          {/* Featured Article (large) */}
          {featured && (
            <>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 mb-3">Featured Article</h2>
              <Link
                href={`/articles/${featured.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="relative h-52 sm:h-80 w-full bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden">
                  {featured.image && (
                    <Image
                      src={featured.image}
                      alt={featured.imageAlt || featured.title}
                      fill
                      sizes="(max-width: 896px) 100vw, 896px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                    />
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                      {featured.category}
                    </span>
                    <span className="text-[11px] text-gray-400">{featured.readTime}</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-lg sm:text-3xl leading-snug group-hover:text-green-600 transition-colors mb-2">
                    {featured.title}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {featured.excerpt || featured.description}
                  </p>
                  <span className="inline-block mt-3 text-green-600 font-semibold text-sm group-hover:underline">
                    Read article →
                  </span>
                </div>
              </Link>
            </>
          )}

          {/* Latest Articles (compact list) */}
          <div className="flex items-center justify-between mt-8 mb-3">
            <h2 className="text-base sm:text-xl font-extrabold text-gray-900">Latest Articles</h2>
            <a href="/articles" className="text-green-600 font-semibold text-xs sm:text-sm hover:underline">
              View all
            </a>
          </div>

          {latestPosts.length > 0 ? (
            <ul className="space-y-2">
              {latestPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/articles/${post.slug}`}
                    className="group flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-2 hover:shadow-md transition"
                  >
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
                      {post.image && (
                        <Image
                          src={post.image}
                          alt={post.imageAlt || post.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-gray-400">{post.readTime}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 py-6 text-sm">No more articles yet. Check back soon.</p>
          )}
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
