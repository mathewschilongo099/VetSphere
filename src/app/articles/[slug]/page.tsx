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
    keywords: post.tags.join(', '),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['Mathews Chilongo'],
      url: `https://vet-sphere.vercel.app/articles/${post.slug}`,
      images: [{ url: imageUrl, alt: post.imageAlt }],
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
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white py-10 sm:py-14 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            {post.category}
          </span>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold leading-snug mb-4">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-gray-400 text-xs sm:text-sm flex-wrap">
            <span>By Mathews Chilongo</span>
            <span>•</span>
            <span>{post.readTime}</span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.image && (
        <div className="w-full max-w-3xl mx-auto px-4 mt-6">
          <div className="relative h-52 sm:h-72 rounded-2xl overflow-hidden">
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              className="object-cover"
              priority
              unoptimized={post.image.startsWith('http')}
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        <div
          className="
            prose prose-sm sm:prose-base max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:hidden
            prose-h2:text-base sm:prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
            prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
            prose-h3:text-sm sm:prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
            prose-li:text-gray-600 prose-li:text-sm
            prose-strong:text-gray-800
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:my-6 prose-img:w-full
            prose-table:text-xs sm:prose-table:text-sm
            prose-th:bg-gray-50 prose-th:p-2 prose-th:font-semibold
            prose-td:p-2 prose-td:border prose-td:border-gray-100
            prose-blockquote:border-l-4 prose-blockquote:border-green-400
            prose-blockquote:bg-green-50 prose-blockquote:px-4 prose-blockquote:py-2
            prose-blockquote:rounded-r-xl prose-blockquote:not-italic
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next Navigation */}
      {(prev || next) && (
        <div className="max-w-3xl mx-auto px-4 mb-10">
          <div className="grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/articles/${prev.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-green-200 transition"
              >
                <span className="text-xs text-green-600 font-semibold mb-1 block">← Previous</span>
                <span className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 group-hover:text-green-600 transition-colors block">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/articles/${next.slug}`}
                className="group bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-green-200 transition text-right"
              >
                <span className="text-xs text-green-600 font-semibold mb-1 block">Next →</span>
                <span className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 group-hover:text-green-600 transition-colors block">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mb-12">
          <h2 className="text-base font-bold text-gray-900 mb-4">Related Articles</h2>
          <div className="space-y-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/articles/${related.slug}`}
                className="group flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3 hover:shadow-md hover:border-green-200 transition"
              >
                {related.image && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={related.image}
                      alt={related.imageAlt || related.title}
                      fill
                      className="object-cover"
                      unoptimized={related.image.startsWith('http')}
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 group-hover:text-green-600 transition-colors block">
                    {related.title}
                  </span>
                  <span className="text-gray-400 text-xs">{related.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back Link */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Link href="/articles" className="inline-flex items-center gap-2 text-green-600 text-sm font-semibold hover:underline">
          ← Back to Articles
        </Link>
      </div>

    </div>
  );
}
