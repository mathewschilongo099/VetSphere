'use client';

import { useState } from 'react';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export default function AnimalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch(
        `https://api.you.com/v1/search?query=${encodeURIComponent(query + ' animal health veterinary')}&count=6`,
        {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_YOU_API_KEY || '',
          },
        }
      );

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      const hits = data.results?.web || [];

      const mapped: SearchResult[] = hits.map((hit: any) => ({
        title: hit.title || 'Untitled',
        url: hit.url || '#',
        snippet: hit.snippets?.[0] || hit.description || 'No description available.',
      }));

      setResults(mapped);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-8">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. symptoms of East Coast Fever in cattle..."
          className="flex-1 px-5 py-4 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 bg-white/95 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-7 py-4 rounded-xl transition whitespace-nowrap"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searched && (
        <div className="max-w-2xl mx-auto mt-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <p className="text-red-300 text-center text-sm py-4">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p className="text-gray-300 text-center text-sm py-4">No results found. Try a different search term.</p>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <p className="text-gray-400 text-xs text-center mb-2">Results for "{query}" — powered by You.com</p>
              {results.map((result, i) => (
                <a
                  key={i}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-4 transition group"
                >
                  <p className="text-xs text-green-400 truncate mb-1">{result.url}</p>
                  <h4 className="text-white font-semibold text-sm group-hover:text-green-300 transition leading-snug mb-1">{result.title}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{result.snippet}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
