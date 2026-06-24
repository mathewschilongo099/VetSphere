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

const ARTICLES_PER_PAGE = 9;

function SearchContent({ initialPosts }: { initialPosts: BlogPost[] }) {
  const searchParams = useSearchParams();
  const [filtered, setFiltered] = useState<BlogPost[]>(initialPosts);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    // Reset to page 1 whenever the filter/search criteria changes, so the
    // person doesn't land on an empty page 5 after a new search returns
    // fewer results than before.
    setCurrentPage(1);
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
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTICLES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ARTICLES_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
    // Scroll back up to the results header so the person sees the new
    // page from the top, rather than staying scrolled at the old bottom.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Build a compact page-number list: always show first, last, current,
  // and a couple of neighbors, with "..." gaps in between for large counts.
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const neighbors = 1;

    for (let p = 1; p <= totalPages; p++) {
      const isEdge = p === 1 || p === totalPages;
      const isNearCurrent = Math.abs(p - safePage) <= neighbors;
      if (isEdge || isNearCurrent) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    return pages;
  };

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

        {pageItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>

                {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                        p === safePage
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
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
