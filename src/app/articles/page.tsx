'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/content/ArticleCard';
import { BlogPost } from '@/types';

export default function ArticlesPage() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filtered, setFiltered] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data);
      setFiltered(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFiltered(
        posts.filter(
          (post) =>
            post.title.toLowerCase().includes(q) ||
            post.description.toLowerCase().includes(q) ||
            post.category.toLowerCase().includes(q) ||
            post.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      );
    } else {
      setFiltered(posts);
    }
  }, [searchParams, posts]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.toLowerCase();
    if (q.trim()) {
      setFiltered(
        posts.filter(
          (post) =>
            post.title.toLowerCase().includes(q) ||
            post.description.toLowerCase().includes(q) ||
            post.category.toLowerCase().includes(q) ||
            post.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      );
    } else {
      setFiltered(posts);
    }
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

      {/* Articles */}
      <section className="max-w-6xl mx-auto px-4 py-16">

        {/* Search Result Info */}
        {query && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-500 text-sm">
              {filtered.length > 0
                ? `Found ${filtered.length} article${filtered.length > 1 ? 's' : ''} for "${query}"`
                : `No articles found for "${query}"`}
            </p>
            <button
              onClick={() => { setQuery(''); setFiltered(posts); }}
              className="text-green-600 text-sm font-semibold hover:underline"
            >
              Clear search ✕
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
            <p className="text-gray-400 text-sm mt-2">Try searching for "cattle", "poultry", "dog" or "disease"</p>
            <button
              onClick={() => { setQuery(''); setFiltered(posts); }}
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
