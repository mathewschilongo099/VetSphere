import Link from 'next/link';
import { Wheat, PawPrint, ShieldCheck } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';
import ArticleCard from '@/components/content/ArticleCard';
import AnimalSearch from '@/components/AnimalSearch';

const TOPICS = [
  {
    title: 'Livestock Health',
    description:
      'Guides on cattle, goats, poultry and pigs covering disease prevention, feeding, breeding and daily farm management.',
    Icon: Wheat,
  },
  {
    title: 'Pet Care',
    description:
      'Straightforward advice for dog and cat owners on health, vaccinations, nutrition and common conditions to watch for.',
    Icon: PawPrint,
  },
  {
    title: 'Disease Prevention',
    description:
      'Learn to recognise early signs of illness, set up proper biosecurity and keep your animals healthy before problems start.',
    Icon: ShieldCheck,
  },
];

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-gray-900 text-white w-full py-12 sm:py-20 overflow-hidden">
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

        <div className="relative max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
            Better Animal Health <br className="hidden sm:block" />
            <span className="text-green-400">Starts Here</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-6 max-w-2xl leading-relaxed">
            Practical veterinary guides for livestock farmers, students and pet owners.
          </p>

          <div className="w-full max-w-xl mb-6">
            <div className="bg-white/5 border border-white/15 rounded-2xl p-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 px-2.5 pt-1.5 pb-1">
                <span className="text-green-400 text-xs font-bold uppercase tracking-wide">Ask VetSphere</span>
                <span className="text-gray-400 text-xs">Get a quick answer</span>
              </div>
              <AnimalSearch />
            </div>
          </div>

          <Link
            href="/articles"
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-xl transition text-center"
          >
            Explore Articles
          </Link>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="w-full py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Latest Articles</h2>
              <p className="text-gray-600 mt-2">Recently published veterinary guides</p>
            </div>
            <Link href="/articles" className="text-green-700 font-semibold text-sm hover:underline shrink-0">
              View all articles
            </Link>
          </div>
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map((post, index) => (
                <ArticleCard key={post.slug} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-16">No articles yet. Check back soon.</p>
          )}
        </div>
      </section>

      {/* Topics */}
      <section className="w-full py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">What You Will Find Here</h2>
          <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            VetSphere covers the topics that matter most to farmers, students and pet owners.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TOPICS.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
