'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react';

export default function GeneratePage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

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

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewArticle = () => {
    if (result?.title) {
      const slug = result.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      window.open(`/articles/${slug}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-gray-900 text-white py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Generate <span className="text-green-400">Article</span>
          </h1>
          <p className="text-gray-300 text-base max-w-xl mx-auto">
            Enter a topic and get a complete SEO-optimized veterinary article in seconds.
          </p>
        </div>
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Content
                  </>
                )}
              </button>
              <button
                onClick={handleViewArticle}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Article
              </button>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Link>
            </div>

            {/* Article Content */}
            <div className="prose prose-sm sm:prose-base max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-6
              prose-h2:text-lg sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
              prose-h3:text-base sm:prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-sm sm:prose-p:text-base prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
              prose-p:first:mt-0
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:my-6
              prose-ul:text-sm sm:prose-ul:text-base prose-ul:text-gray-700 prose-ul:mb-5
              prose-ol:text-sm sm:prose-ol:text-base prose-ol:text-gray-700 prose-ol:mb-5
              prose-li:mb-1.5
              prose-blockquote:border-l-4 prose-blockquote:border-green-500
              prose-blockquote:bg-green-50 prose-blockquote:px-4 sm:prose-blockquote:px-6 prose-blockquote:py-3
              prose-blockquote:rounded-r-xl prose-blockquote:not-italic
              prose-blockquote:text-sm sm:prose-blockquote:text-base
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
