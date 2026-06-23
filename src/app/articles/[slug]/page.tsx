import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

// =========================
// AGGRESSIVE CLEAN CONTENT FUNCTION
// Removes duplicated images, captions, and fixes ghost spacing gaps
// =========================
function cleanArticleContent(html: string): string {
  // 1. Remove any <h2> or <h3> that says "Image" followed by a number
  html = html.replace(/<h[23][^>]*>Image\s+\d+.*?<\/h[23]>/gi, '');
  
  // 2. Remove any paragraph that contains "Photo:" or "via Unsplash" (case insensitive)
  html = html.replace(/<p[^>]*>.*?Photo:.*?<\/p>/gi, '');
  html = html.replace(/<p[^>]*>.*?via\s+Unsplash.*?<\/p>/gi, '');
  
  // 3. Remove any paragraph with "Image Description" or "Caption" (case insensitive)
  html = html.replace(/<p[^>]*>.*?Image\s+Description.*?<\/p>/gi, '');
  html = html.replace(/<p[^>]*>.*?Caption:.*?<\/p>/gi, '');
  
  // 4. Remove any paragraph with "Image 1:", "Image 2:", etc.
  html = html.replace(/<p[^>]*>.*?Image\s+\d+:.*?<\/p>/gi, '');
  
  // 5. Remove any paragraph with "Source:" or "Credit:"
  html = html.replace(/<p[^>]*>.*?Source:.*?<\/p>/gi, '');
  html = html.replace(/<p[^>]*>.*?Credit:.*?<\/p>/gi, '');
  
  // 6. Remove any HTML image tags to prevent duplication with the featured image banner
  html = html.replace(/<img[^>]*>/gi, '');
  
  // 7. Remove any image markdown that might be left
  html = html.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  
  // 8. Remove any remaining "Photo:" anywhere (including inside other tags)
  html = html.replace(/Photo:[^<]*(?:<[^>]+>)*/gi, '');
  
  // ==========================================
  // NEW FIXES FOR THE LARGE GAPS
  // ==========================================
  
  // 9. Wipe out any paragraphs that are completely empty or only contain spaces, &nbsp;, or <br> tags
  html = html.replace(/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  
  // 10. Collapse multiple consecutive line breaks down to a single one
  html = html.replace(/(<br\s*\/?>\s*){2,}/gi, '');
  
  return html.trim();
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Article Not Found | VetSphere',
    };
  }

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
      images: [
        {
          url: post.image?.startsWith('http')
            ? post.image
            : `https://vet-sphere.vercel.app${post.image}`,
          alt: post.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [
        post.image?.startsWith('http')
          ? post.image
          : `https://vet-sphere.vercel.app${post.image}`,
      ],
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) return notFound();

  // Clean the content aggressively
  const cleanedContent = cleanArticleContent(post.content);

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
        <div className="relative w-full max-w-3xl mx-auto px-4 mt-6">
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
            prose-h2:text-base sm:prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
            prose-h3:text-sm sm:prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
            prose-li:text-gray-600 prose-li:text-sm sm:prose-li:text-base
            prose-strong:text-gray-800
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:my-6
            prose-table:text-xs sm:prose-table:text-sm
            prose-th:bg-gray-50 prose-th:p-2 prose-th:font-semibold
            prose-td:p-2 prose-td:border prose-td:border-gray-100
            prose-blockquote:border-l-4 prose-blockquote:border-green-400 prose-blockquote:bg-green-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-xl
          "
          dangerouslySetInnerHTML={{ __html: cleanedContent }}
        />
      </article>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs sm:text-sm text-yellow-800">
          <strong>Disclaimer:</strong> This article is for informational purposes only. Always consult with a qualified veterinarian for specific health concerns regarding your animals.
        </div>
      </div>

      {/* Author Bio */}
      <div className="max-w-3xl mx-auto px-4 mb-12">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-green-500">
            <Image
              src="/images/articles/mathews.jpg"
              alt="Mathews Chilongo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Mathews Chilongo</p>
            <p className="text-green-600 text-xs font-medium mb-1">Veterinary Practitioner & Freelancer</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Passionate about animal health and helping farmers and pet owners worldwide with practical, reliable veterinary knowledge.
            </p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <a href="/articles" className="inline-flex items-center gap-2 text-green-600 text-sm font-semibold hover:underline">
          ← Back to Articles
        </a>
      </div>

    </div>
  );
}
