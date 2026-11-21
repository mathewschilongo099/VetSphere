import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

const SITE = 'https://vetsphere.cc.cd';

function absoluteImage(image?: string) {
  if (!image) return `${SITE}/logo.png`;
  return image.startsWith('http') ? image : `${SITE}${image}`;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Article Not Found | VetSphere' };

  const imageUrl = absoluteImage(post.image);

  return {
    title: `${post.title} | VetSphere`,
    description: post.description,
    keywords: post.tags?.join(', ') || '',
    authors: [{ name: post.author }],
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: `${SITE}/articles/${post.slug}`,
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
  const url = `${SITE}/articles/${post.slug}`;
  const dateLabel = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const cleanContent = post.content
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        image: [absoluteImage(post.image)],
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Person', name: post.author },
        publisher: {
          '@type': 'Organization',
          name: 'VetSphere',
          logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
        },
        mainEntityOfPage: url,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE}/articles` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </nav>

        {post.category && (
          <div className="mb-3">
            <span className="inline-block bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
          </div>
        )}

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 mb-6">
          <span>By <Link href="/about" className="font-medium text-gray-700 hover:text-green-600">{post.author}</Link></span>
          <span>•</span>
          <time dateTime={post.date}>{dateLabel}</time>
          <span>•</span>
          <span>{post.readTime || '5 min read'}</span>
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-6">
          Educational information only — not a substitute for a licensed veterinarian. See our{' '}
          <Link href="/disclaimer" className="text-green-600 underline">Veterinary Disclaimer</Link>.
        </p>

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
            prose prose-sm sm:prose-base max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-6
            prose-h2:text-lg sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
            prose-h3:text-base sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-sm sm:prose-p:text-base prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
            prose-p:first:mt-0
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-sm sm:prose-ul:text-base prose-ul:text-gray-700 prose-ul:mb-5
            prose-ol:text-sm sm:prose-ol:text-base prose-ol:text-gray-700 prose-ol:mb-5
            prose-li:mb-1.5
            prose-img:rounded-xl prose-img:my-6
            prose-blockquote:border-l-4 prose-blockquote:border-green-500
            prose-blockquote:bg-green-50 prose-blockquote:px-4 sm:prose-blockquote:px-6 prose-blockquote:py-3
            prose-blockquote:rounded-r-xl prose-blockquote:not-italic
            prose-blockquote:text-sm sm:prose-blockquote:text-base prose-blockquote:text-gray-700
            prose-table:text-xs sm:prose-table:text-sm
            prose-th:bg-gray-50 prose-th:p-2 sm:prose-th:p-3 prose-th:font-semibold
            prose-td:p-2 sm:prose-td:p-3 prose-td:border prose-td:border-gray-200
            prose-hr:hidden
          "
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />

        <aside className="mt-10 flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <div className="w-12 h-12 shrink-0 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
            {post.author.charAt(0)}
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p className="font-semibold text-gray-900">{post.author}</p>
            <p>
              Founder of VetSphere and a veterinary student in Zambia. Articles are AI-assisted, then reviewed and edited by the author. Spotted an error?{' '}
              <Link href="/contact" className="text-green-600 underline">Tell us</Link>. Read our{' '}
              <Link href="/about" className="text-green-600 underline">editorial policy</Link>.
            </p>
          </div>
        </aside>
      </article>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
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

        {relatedPosts && relatedPosts.length > 0 && (
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {relatedPosts.map((related: any) => (
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
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
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
