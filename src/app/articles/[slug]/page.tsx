import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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

      {/* Article Header - Clean & Minimal */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Category */}
        {post.category && (
          <div className="mb-4">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta Data */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-8">
          <span>By <span className="font-medium text-gray-700">Mathews Chilongo</span></span>
          <span>•</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          <span>•</span>
          <span>{post.readTime || '5 min read'}</span>
        </div>

        {/* Featured Image */}
        {post.image && (
          <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-10 bg-gray-100">
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

        {/* Article Content */}
        <div
          className="
            prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-4xl prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-gray-700 prose-ul:mb-5
            prose-ol:text-gray-700 prose-ol:mb-5
            prose-li:mb-1
            prose-img:rounded-xl prose-img:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-green-500
            prose-blockquote:bg-green-50 prose-blockquote:px-6 prose-blockquote:py-4
            prose-blockquote:rounded-r-xl prose-blockquote:not-italic
            prose-blockquote:text-gray-700
            prose-table:text-sm
            prose-th:bg-gray-50 prose-th:p-3 prose-th:font-semibold
            prose-td:p-3 prose-td:border prose-td:border-gray-200
            prose-hr:my-12
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Navigation & Related Posts - Outside the article container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Prev / Next Navigation */}
        {(prev || next) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {prev ? (
              <Link
                href={`/articles/${prev.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-green-200 transition"
              >
                <span className="text-xs text-green-600 font-semibold mb-2 block">← Previous</span>
                <span className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/articles/${next.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-green-200 transition text-right"
              >
                <span className="text-xs text-green-600 font-semibold mb-2 block">Next →</span>
                <span className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        )}

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/articles/${related.slug}`}
                  className="group bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-green-200 transition"
                >
                  {related.image && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={related.image}
                        alt={related.imageAlt || related.title}
                        fill
                        className="object-cover"
                        unoptimized={related.image.startsWith('http')}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                      {related.title}
                    </h3>
                    <span className="text-gray-400 text-xs">{related.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-green-600 text-sm font-semibold hover:underline"
          >
            ← Back to Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
