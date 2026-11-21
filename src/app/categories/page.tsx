import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Categories | VetSphere',
  description: 'Browse VetSphere veterinary guides by topic: cattle, dairy, goats and sheep, poultry, pigs, pets and general animal health.',
  alternates: { canonical: '/categories' },
};

export default function CategoriesPage() {
  const posts = getAllPosts();
  const categories = CATEGORIES.map((c) => ({
    ...c,
    count: posts.filter((p) => p.category === c.name).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <section className="bg-gray-900 text-white py-10 sm:py-20 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 sm:mb-4">Categories</h1>
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto">
            Find veterinary guides by animal and topic.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/articles?category=${encodeURIComponent(c.name)}`}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">{c.icon}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{c.name}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{c.description}</p>
              <span className="mt-auto text-green-600 text-sm font-semibold">
                {c.count} article{c.count === 1 ? '' : 's'} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
