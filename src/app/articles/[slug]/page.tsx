import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

// =========================
// AGGRESSIVE CLEAN CONTENT FUNCTION
// Removes ANY element containing Photo, Image Description, Caption, etc.
// =========================
function cleanArticleContent(html: string): string {
  // 1. Remove any <h2> or <h3> that says "Image" followed by a number
  html = html.replace(
    /&lt;h[23][^&gt;]*&gt;Image\s+\d+.*?&lt;\/h[23]&gt;/gi,
    ''
  );
  
  // 2. Remove any paragraph that contains "Photo:" or "via Unsplash" (case insensitive)
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?Photo:.*?&lt;\/p&gt;/gi,
    ''
  );
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?via\s+Unsplash.*?&lt;\/p&gt;/gi,
    ''
  );
  
  // 3. Remove any paragraph with "Image Description" or "Caption" (case insensitive)
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?Image\s+Description.*?&lt;\/p&gt;/gi,
    ''
  );
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?Caption:.*?&lt;\/p&gt;/gi,
    ''
  );
  
  // 4. Remove any paragraph with "Image 1:", "Image 2:", etc.
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?Image\s+\d+:.*?&lt;\/p&gt;/gi,
    ''
  );
  
  // 5. Remove any paragraph with "Source:" or "Credit:"
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?Source:.*?&lt;\/p&gt;/gi,
    ''
  );
  html = html.replace(
    /&lt;p[^&gt;]*&gt;.*?Credit:.*?&lt;\/p&gt;/gi,
    ''
  );
  
  // 6. NEW: Remove any HTML image tags to prevent duplication with the featured image banner
  html = html.replace(/&lt;img[^&gt;]*&gt;/gi, '');
  
  // 7. Remove any image markdown that might be left
  html = html.replace(
    /!\[[^\]]*\]\([^)]*\)/g,
    ''
  );
  
  // 8. Remove any remaining "Photo:" anywhere (including inside other tags)
  html = html.replace(
    /Photo:[^&lt;]*(?:&lt;[^&gt;]+&gt;)*/gi,
    ''
  );
  
  // 9. Clean up multiple empty paragraphs
  html = html.replace(/(&lt;p&gt;\s*&lt;\/p&gt;)+/g, '');
  
  // 10. Remove excessive whitespace
  html = html.trim();
  
  return html;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise&lt;Metadata&gt; {
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
    &lt;div className="min-h-screen bg-white w-full overflow-x-hidden"&gt;

      {/* Hero */}
      &lt;section className="bg-gray-900 text-white py-10 sm:py-14 w-full"&gt;
        &lt;div className="max-w-3xl mx-auto px-4 text-center"&gt;
          &lt;span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-widest"&gt;
            {post.category}
          &lt;/span&gt;
          &lt;h1 className="text-lg sm:text-2xl lg:text-3xl font-bold leading-snug mb-4"&gt;
            {post.title}
          &lt;/h1&gt;
          &lt;div className="flex items-center justify-center gap-3 text-gray-400 text-xs sm:text-sm flex-wrap"&gt;
            &lt;span&gt;By Mathews Chilongo&lt;/span&gt;
            &lt;span&gt;•&lt;/span&gt;
            &lt;span&gt;{post.readTime}&lt;/span&gt;
            &lt;span&gt;•&lt;/span&gt;
            &lt;span&gt;{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

      {/* Featured Image */}
      {post.image && (
        &lt;div className="relative w-full max-w-3xl mx-auto px-4 mt-6"&gt;
          &lt;div className="relative h-52 sm:h-72 rounded-2xl overflow-hidden"&gt;
            &lt;Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              className="object-cover"
              priority
              unoptimized={post.image.startsWith('http')}
            />
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {/* Article Content */}
      &lt;article className="max-w-3xl mx-auto px-4 py-10"&gt;
        &lt;div
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
      &lt;/article&gt;

      {/* Tags */}
      {post.tags.length &gt; 0 && (
        &lt;div className="max-w-3xl mx-auto px-4 mb-8"&gt;
          &lt;div className="flex flex-wrap gap-2"&gt;
            {post.tags.map((tag) => (
              &lt;span
                key={tag}
                className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full"
              &gt;
                #{tag}
              &lt;/span&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {/* Disclaimer */}
      &lt;div className="max-w-3xl mx-auto px-4 mb-8"&gt;
        &lt;div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs sm:text-sm text-yellow-800"&gt;
          &lt;strong&gt;Disclaimer:&lt;/strong&gt; This article is for informational purposes only. Always consult with a qualified veterinarian for specific health concerns regarding your animals.
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Author Bio */}
      &lt;div className="max-w-3xl mx-auto px-4 mb-12"&gt;
        &lt;div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center gap-4"&gt;
          &lt;div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-green-500"&gt;
            &lt;Image
              src="/images/articles/mathews.jpg"
              alt="Mathews Chilongo"
              fill
              className="object-cover"
            />
          &lt;/div&gt;
          &lt;div&gt;
            &lt;p className="font-bold text-gray-900 text-sm"&gt;Mathews Chilongo&lt;/p&gt;
            &lt;p className="text-green-600 text-xs font-medium mb-1"&gt;Veterinary Practitioner & Freelancer&lt;/p&gt;
            &lt;p className="text-gray-500 text-xs leading-relaxed"&gt;
              Passionate about animal health and helping farmers and pet owners worldwide with practical, reliable veterinary knowledge.
            </p>
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Back Link */}
      &lt;div className="max-w-3xl mx-auto px-4 pb-16"&gt;
        &lt;a href="/articles" className="inline-flex items-center gap-2 text-green-600 text-sm font-semibold hover:underline"&gt;
          ← Back to Articles
        &lt;/a&gt;
      &lt;/div&gt;

    &lt;/div&gt;
  );
}
