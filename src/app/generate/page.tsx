'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';

export default function GeneratePage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/generate?topic=${encodeURIComponent(topic.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-gray-900 text-white py-12 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
          Generate <span className="text-green-400">Article</span>
        </h1>
        <p className="text-gray-300 text-base max-w-xl mx-auto">
          Enter a topic and get a complete SEO-optimized veterinary article in seconds.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Input Form */}
        <form onSubmit={handleGenerate} className="flex gap-3 mb-8">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a veterinary topic (e.g., bloat in cattle)"
            className="flex-1 px-5 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-xl transition whitespace-nowrap"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-gray-500 ml-2">Generating your article...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Hero Image */}
            {result.heroImage && (
              <div className="relative h-56 sm:h-80 rounded-2xl overflow-hidden">
                <Image
                  src={result.heroImage}
                  alt={result.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {result.title}
            </h1>

            {/* Meta Description (Subtitle) */}
            {result.metaDescription && (
              <p className="text-gray-500 text-base italic">
                {result.metaDescription}
              </p>
            )}

            {/* Tags */}
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag: string) => (
                  <span key={tag} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-200">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-sm sm:prose-base max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-lg sm:prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
              prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
              prose-h3:text-base sm:prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-strong:text-gray-800
              prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:my-6
              prose-ul:text-gray-600
              prose-ol:text-gray-600
              prose-li:mb-1
            ">
              <ReactMarkdown>
                {result.content}
              </ReactMarkdown>
            </div>

            {/* Feedback */}
            <div className="border-t border-gray-100 pt-6 mt-6 text-center text-gray-400 text-sm">
              Article generated by VetSphere AI · {result.usedFallback ? 'Used fallback provider' : 'Powered by Gemini'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
