import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Article Not Found | VetSphere' };

  const imageUrl = post.image?.startsWith('http')
    ? post.image
    : `https://vet-sphere.vercel.app${post.image}`;

  return {
    title: `${post.title} | VetSphere`,
    description: post.description,
    keywords: post.tags?.join(', ') || '',
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['Mathews Chilongo'],
      url: `https://vet-sphere.vercel.app/articles/${post.slug}`,
      images: [{ url: imageUrl, alt: post.imageAlt || post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [imageUrl],
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return notFound();

  const { prev, next } = getAdjacentPosts(params.slug);
  const relatedPosts = getRelatedPosts(params.slug, 3);

  return (
    <div className="min-h-screen bg-white">

      {/* Article Container - Optimized for mobile */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        
        {/* Back Button - Top Left */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>

        {/* Category */}
        {post.category && (
          <div className="mb-3">
            <span className="inline-block bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
          </div>
        )}

        {/* Title - Smaller on mobile */}
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          {post.title}
        </h1>

        {/* Meta Data - Compact on mobile */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 mb-6">
          <span>By <span className="font-medium text-gray-700">Mathews Chilongo</span></span>
          <span>•</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </time>
          <span>•</span>
          <span>{post.readTime || '5 min read'}</span>
        </div>

        {/* Featured Image - Responsive */}
        {post.image && (
          <div className="relative w-full h-48 sm:h-64 lg:h-80 rounded-xl overflow-hidden mb-6 bg-gray-100">
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              className="object-cover"
              priority
              unoptimized={post.image.startsWith('http')}
            />
          </div>
        )}

        {/* Article Content - Mobile-friendly sizing */}
        <div
          className="
            prose prose-sm sm:prose-base max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-4
            prose-h2:text-lg sm:prose-h2:text-2xl prose-h2:mt-6 sm:prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-base sm:prose-h3:text-xl prose-h3:mt-5 sm:prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-sm sm:prose-p:text-base prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-sm sm:prose-ul:text-base prose-ul:text-gray-700 prose-ul:mb-4
            prose-ol:text-sm sm:prose-ol:text-base prose-ol:text-gray-700 prose-ol:mb-4
            prose-li:mb-1
            prose-img:rounded-xl prose-img:my-4 sm:prose-img:my-6
            prose-blockquote:border-l-4 prose-blockquote:border-green-500
            prose-blockquote:bg-green-50 prose-blockquote:px-4 sm:prose-blockquote:px-6 prose-blockquote:py-3
            prose-blockquote:rounded-r-xl prose-blockquote:not-italic
            prose-blockquote:text-sm sm:prose-blockquote:text-base prose-blockquote:text-gray-700
            prose-table:text-xs sm:prose-table:text-sm
            prose-th:bg-gray-50 prose-th:p-2 sm:prose-th:p-3 prose-th:font-semibold
            prose-td:p-2 sm:prose-td:p-3 prose-td:border prose-td:border-gray-200
            prose-hr:my-8 sm:prose-hr:my-10
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-[10px] sm:text-xs px-2.5 py-1 rounded-full hover:bg-gray-200 transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Navigation & Related Posts */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        {/* Prev / Next Navigation */}
        {(prev || next) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
            {prev ? (
              <Link
                href={`/articles/${prev.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:shadow-md hover:border-green-200 transition"
              >
                <span className="text-[10px] sm:text-xs text-green-600 font-semibold mb-1 sm:mb-2 block">← Previous</span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/articles/${next.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:shadow-md hover:border-green-200 transition text-right"
              >
                <span className="text-[10px] sm:text-xs text-green-600 font-semibold mb-1 sm:mb-2 block">Next →</span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        )}

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/articles/${related.slug}`}
                  className="group bg-gray-50 border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-green-200 transition"
                >
                  {related.image && (
                    <div className="relative h-28 sm:h-32 w-full">
                      <Image
                        src={related.image}
                        alt={related.imageAlt || related.title}
                        fill
                        className="object-cover"
                        unoptimized={related.image.startsWith('http')}
                      />
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                      {related.title}
                    </h3>
                    <span className="text-gray-400 text-[10px] sm:text-xs">{related.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
