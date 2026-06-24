import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { Metadata } from 'next';

'use client';

import { useState, useEffect } from 'react';

// FAQ Accordion Component
function FAQAccordion({ content }: { content: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    // Extract FAQ section from content
    const faqSection = content.match(/##\s*Frequently Asked Questions About.*?([\s\S]*?)(?=##|$)/i);
    if (faqSection) {
      const faqText = faqSection[1];
      // Parse Q&A pairs
      const qaPairs: { question: string; answer: string }[] = [];
      const lines = faqText.split('\n');
      let currentQuestion = '';
      let currentAnswer = '';
      let isCollectingAnswer = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if line starts with a question marker
        if (line.match(/^\*\*Q[:.]?\s*|^Q[:.]?\s*|^\d+\.\s*\*\*/i) || 
            (line.match(/^\*\*.*\?\*\*$/) && !line.includes('Answer:'))) {
          // Save previous Q&A if exists
          if (currentQuestion && currentAnswer) {
            qaPairs.push({
              question: currentQuestion.replace(/^\*\*Q[:.]?\s*|^Q[:.]?\s*|^\d+\.\s*\*\*/, '').replace(/\*\*$/, '').trim(),
              answer: currentAnswer.trim()
            });
          }
          currentQuestion = line;
          currentAnswer = '';
          isCollectingAnswer = false;
        } else if (line.match(/^\*\*Answer[:.]?\s*|^Answer[:.]?\s*/i)) {
          isCollectingAnswer = true;
          currentAnswer += line.replace(/^\*\*Answer[:.]?\s*|^Answer[:.]?\s*/i, '').trim() + ' ';
        } else if (isCollectingAnswer) {
          currentAnswer += line + ' ';
        } else if (line && !line.match(/^##/)) {
          // If no explicit Answer marker, treat as answer
          if (currentQuestion) {
            isCollectingAnswer = true;
            currentAnswer += line + ' ';
          }
        }
      }
      
      // Save last Q&A
      if (currentQuestion && currentAnswer) {
        qaPairs.push({
          question: currentQuestion.replace(/^\*\*Q[:.]?\s*|^Q[:.]?\s*|^\d+\.\s*\*\*/, '').replace(/\*\*$/, '').trim(),
          answer: currentAnswer.trim()
        });
      }

      if (qaPairs.length > 0) {
        setFaqs(qaPairs);
      } else {
        // Fallback: try to find Q&A with simple pattern
        const simpleMatches = faqText.match(/\*\*([^*?]+)\?\*\*([\s\S]*?)(?=\*\*[^*?]+\?\*\*|$)/g);
        if (simpleMatches) {
          const parsed = simpleMatches.map(match => {
            const qMatch = match.match(/\*\*([^*?]+)\?\*\*/);
            const aMatch = match.match(/\*\*([^*?]+)\?\*\*([\s\S]*?)$/);
            return {
              question: qMatch ? qMatch[1].trim() : 'Question',
              answer: aMatch ? aMatch[2].trim() : 'Answer'
            };
          });
          setFaqs(parsed);
        }
      }
    }
  }, [content]);

  if (faqs.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-green-200 transition-colors"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 sm:px-5 sm:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">
                {faq.question}
              </span>
              <span className="shrink-0 text-gray-400">
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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

  // Clean content: remove horizontal lines and clean up spacing
  const cleanContent = post.content
    .replace(/^---\s*$/gm, '') // Remove horizontal lines
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();

  // Remove FAQ section from content (we'll render it separately with accordion)
  const contentWithoutFAQ = cleanContent.replace(
    /##\s*Frequently Asked Questions About.*?([\s\S]*?)(?=##|$)/i,
    ''
  );

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

        {/* Article Content - Mobile-friendly sizing with cleaned content */}
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
          dangerouslySetInnerHTML={{ __html: contentWithoutFAQ }}
        />

        {/* FAQ Accordion - Only questions visible, answers expand on click */}
        <FAQAccordion content={cleanContent} />

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
