import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

// =========================
// CLEAN CONTENT FUNCTION
// Removes all unwanted image credits, photo lines, and image sections
// =========================
function cleanArticleContent(html: string): string {
  // Remove "Photo: ... — via Unsplash" (bold or not)
  html = html.replace(
    /<p>\s*(\*{1,2})?Photo:[^<]*via Unsplash[^<]*(\*{1,2})?\s*<\/p>/gi,
    ''
  );
  
  // Remove any "Photo: ..." standalone lines
  html = html.replace(
    /<p>\s*Photo:[^<]*<\/p>/gi,
    ''
  );
  
  // Remove "## Image 1", "## Image 2" headings and their content (including descriptions)
  html = html.replace(
    /<h2>Image\s+\d+.*?<\/h2>[\s\S]*?(?=<h2>|$)/gi,
    ''
  );
  
  // Remove "### Image 1", "### Image 2" headings
  html = html.replace(
    /<h3>Image\s+\d+.*?<\/h3>[\s\S]*?(?=<h3>|$)/gi,
    ''
  );
  
  // Remove "Image Description" and "Caption" lines
  html = html.replace(
    /<p><strong>Image Description:<\/strong>.*?<\/p>/gi,
    ''
  );
  html = html.replace(
    /<p><strong>Caption:<\/strong>.*?<\/p>/gi,
    ''
  );
  html = html.replace(
    /<p><em>Image Description:<\/em>.*?<\/p>/gi,
    ''
  );
  html = html.replace(
    /<p><em>Caption:<\/em>.*?<\/p>/gi,
    ''
  );
  
  // Remove any markdown image syntax that might have slipped through
  html = html.replace(
    /!\[[^\]]*\]\([^)]*\)/g,
    ''
  );
  
  // Remove "Image 1:", "Image 2:" lines
  html = html.replace(
    /<p>\s*Image\s+\d+:[^<]*<\/p>/gi,
    ''
  );
  
  // Remove "Source:" and "Credit:" lines
  html = html.replace(
    /<p>\s*Source:[^<]*<\/p>/gi,
    ''
  );
  html = html.replace(
    /<p>\s*Credit:[^<]*<\/p>/gi,
    ''
  );
  
  // Clean up extra empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  // Remove extra whitespace
  html = html.trim();
  
  return html;
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

  // Clean the content before rendering
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
