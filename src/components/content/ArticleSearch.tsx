'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/content/ArticleCard';
import { BlogPost } from '@/types';

const CATEGORIES = [
  { label: 'All Articles', value: '' },
  { label: 'Livestock Health', value: 'livestock' },
  { label: 'Pet Care', value: 'pets' },
  { label: 'Animal Health', value: 'animal health' },
  { label: 'Disease Prevention', value: 'disease-prevention' },
];

function SearchContent({ initialPosts }: { initialPosts: BlogPost[] }) {
  const searchParams = useSearchParams();
  const [filtered, setFiltered] = useState<BlogPost[]>(initialPosts);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    const categoryQuery = searchParams.get('category') || '';
    setQuery(searchQuery);
    setActiveCategory(categoryQuery);
  }, [searchParams]);

  useEffect(() => {
    let result = initialPosts;

    if (activeCategory) {
      result = result.filter((post) =>
        post.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(activeCategory.toLowerCase()))
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q) ||
          post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    setFiltered(result);
  }, [initialPosts, query, activeCategory]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.toLowerCase();
    let result = initialPosts;
    if (activeCategory) {
      result = result.filter((post) =>
        post.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(activeCategory.toLowerCase()))
      );
    }
    if (q.trim()) {
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q) ||
          post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }

  return (
    <>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mt-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles... e.g. cattle, poultry, dog care"
          className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shrink-0"
        >
          Search
        </button>
      </form>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 w-full sticky top-16 z-40 mt-4">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setActiveCategory(value); setQuery(''); }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {(query || activeCategory) && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-500 text-sm">
              {filtered.length > 0
                ? `${filtered.length} article${filtered.length > 1 ? 's' : ''} found`
                : 'No articles found'}
            </p>
            <button
              onClick={() => { setQuery(''); setActiveCategory(''); }}
              className="text-green-600 text-sm font-semibold hover:underline"
            >
              Clear filters ✕
            </button>
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg font-medium">No articles found</p>
            <p className="text-gray-400 text-sm mt-2">Try a different category or search term</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory(''); }}
              className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition"
            >
              View All Articles
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function ArticleSearch({ initialPosts }: { initialPosts: BlogPost[] }) {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 py-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
        ))}
      </div>
    }>
      <SearchContent initialPosts={initialPosts} />
    </Suspense>
  );
}
