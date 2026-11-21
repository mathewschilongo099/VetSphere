'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/content/ArticleCard';
import { BlogPost } from '@/types';

const ARTICLES_PER_PAGE = 9;

// A post matches a category if its category contains the text or one of its
// tags equals it, and matches a search if the text appears in its details.
function matches(post: BlogPost, category: string, query: string): boolean {
  const c = category.trim().toLowerCase();
  const q = query.trim().toLowerCase();

  if (c) {
    const inCategory = post.category.toLowerCase().includes(c);
    const inTags = post.tags.some((tag) => tag.toLowerCase() === c);
    if (!inCategory && !inTags) return false;
  }

  if (q) {
    return (
      post.title.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return true;
}

function SearchContent({ initialPosts }: { initialPosts: BlogPost[] }) {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Category tabs come from the real article categories.
  const categories = useMemo(
    () =>
      Array.from(new Set(initialPosts.map((p) => p.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [initialPosts]
  );

  useEffect(() => {
    if (!searchParams) return;
    setQuery(searchParams.get('search') ?? '');
    setActiveCategory(searchParams.get('category') ?? '');
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, activeCategory]);

  const filtered = useMemo(
    () => initialPosts.filter((post) => matches(post, activeCategory, query)),
    [initialPosts, activeCategory, query]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTICLES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ARTICLES_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const tabs = [{ label: 'All Articles', value: '' }, ...categories.map((c) => ({ label: c, value: c }))];

  return (
    <>
      {/* Search Bar */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex gap-2 max-w-xl mx-auto mt-5 px-4"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search articles"
          placeholder="Search articles... e.g. cattle, poultry, dog care"
          className="flex-1 min-w-0 px-4 py-3 rounded-xl text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition shrink-0"
        >
          Search
        </button>
      </form>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 w-full sticky top-16 z-40 mt-3">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {tabs.map(({ label, value }) => (
            <button
              key={value || 'all'}
              onClick={() => {
                setActiveCategory(value);
                setQuery('');
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory.toLowerCase() === value.toLowerCase()
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
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        {(query || activeCategory) && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-500 text-sm">
              {filtered.length > 0
                ? `${filtered.length} article${filtered.length > 1 ? 's' : ''} found`
                : 'No articles found'}
            </p>

            <button
              onClick={() => {
                setQuery('');
                setActiveCategory('');
              }}
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
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">
                      …
                    </span>
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
            <p className="text-gray-400 text-sm mt-2">
              Try a different category or search term
            </p>

            <button
              onClick={() => {
                setQuery('');
                setActiveCategory('');
              }}
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
    <Suspense
      fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      }
    >
      <SearchContent initialPosts={initialPosts} />
    </Suspense>
  );
}
