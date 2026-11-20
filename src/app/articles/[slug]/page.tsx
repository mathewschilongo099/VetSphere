import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts } from '@/lib/blog';
import { generateArticleSchema } from '@/lib/seo';
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
    : `https://vetsphere.cc.cd${post.image}`;

  return {
    title: `${post.title} | VetSphere`,
    description: post.description,
    keywords: post.tags?.join(', ') || '',
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['Mathews Chilongo'],
      url: `https://vetsphere.cc.cd/articles/${post.slug}`,
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

  const schemaImage = post.image?.startsWith('http')
    ? post.image
    : `https://vetsphere.cc.cd${post.image}`;

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.description,
    slug: post.slug,
    date: post.date,
    author: 'Mathews Chilongo',
    image: schemaImage,
  });

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>

        {post.category && (
          <div className="mb-3">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-6">
          <span>By <span className="font-medium text-gray-700">Mathews Chilongo</span></span>
          <span aria-hidden="true">•</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </time>
          <span aria-hidden="true">•</span>
          <span>{post.readTime || '5 min read'}</span>
        </div>

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

        <div
          className="
            prose prose-base max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
            prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-green-700 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-gray-700 prose-ul:mb-5
            prose-ol:text-gray-700 prose-ol:mb-5
            prose-li:mb-1.5
            prose-img:rounded-xl prose-img:my-6
            prose-blockquote:border-l-4 prose-blockquote:border-green-500
            prose-blockquote:bg-green-50 prose-blockquote:px-4 sm:prose-blockquote:px-6 prose-blockquote:py-3
            prose-blockquote:rounded-r-xl prose-blockquote:not-italic
            prose-blockquote:text-gray-700
            prose-table:text-sm
            prose-th:bg-gray-50 prose-th:p-3 prose-th:font-semibold
            prose-td:p-3 prose-td:border prose-td:border-gray-200
            prose-hr:hidden
          "
          dangerouslySetInnerHTML={{ __html: post.content.trim() }}
        />
      </article>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        {(prev || next) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
            {prev ? (
              <Link
                href={`/articles/${prev.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-green-200 transition"
              >
                <span className="text-xs text-green-700 font-semibold mb-1 sm:mb-2 block">← Previous</span>
                <span className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/articles/${next.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-green-200 transition text-right"
              >
                <span className="text-xs text-green-700 font-semibold mb-1 sm:mb-2 block">Next →</span>
                <span className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        )}

        {relatedPosts && relatedPosts.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
              You Might Also Like
            </h2>
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
                        unoptimized={related.image?.startsWith('http')}
                      />
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {related.readTime || '5 min read'}
                    </p>
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
