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

function ArticlesContent() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filtered, setFiltered] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    const categoryQuery = searchParams.get('category') || '';
    setQuery(searchQuery);
    setActiveCategory(categoryQuery);
  }, [searchParams]);

  useEffect(() => {
    let result = posts;

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
  }, [posts, query, activeCategory]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.toLowerCase();
    let result = posts;
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

  function handleCategoryClick(value: string) {
    setActiveCategory(value);
    setQuery('');
  }

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white py-20 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            Knowledge Base
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">All Articles</h1>
          <p className="text-gray-400 text-base sm:text-xl mb-8">
            Browse our full library of veterinary knowledge — free for everyone.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
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
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="bg-white border-b border-gray-100 w-full sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleCategoryClick(value)}
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
      </section>

      {/* Articles */}
      <section className="max-w-6xl mx-auto px-4 py-16">

        {/* Result Info */}
        {(query || activeCategory) && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-500 text-sm">
              {filtered.length > 0
                ? `${filtered.length} article${filtered.length > 1 ? 's' : ''} found${activeCategory ? ` in "${activeCategory}"` : ''}${query ? ` for "${query}"` : ''}`
                : `No articles found`}
            </p>
            <button
              onClick={() => { setQuery(''); setActiveCategory(''); }}
              className="text-green-600 text-sm font-semibold hover:underline"
            >
              Clear filters ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
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
      </section>

    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading articles...</p>
        </div>
      </div>
    }>
      <ArticlesContent />
    </Suspense>
  );
}
