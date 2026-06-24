'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

// Generate FAQs using Gemini based on article content
async function generateFAQs(content: string, title: string): Promise<{ question: string; answer: string }[]> {
  try {
    // Extract the main topic from the article (first 500 characters)
    const topic = content.substring(0, 500).replace(/[#*!\[\]]/g, '').trim();
    
    const response = await fetch('/api/generate-faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: topic,
        title: title,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.faqs && data.faqs.length > 0) {
        return data.faqs;
      }
    }
    return getFallbackFAQs(title);
  } catch (error) {
    console.error('Error generating FAQs:', error);
    return getFallbackFAQs(title);
  }
}

// Fallback FAQs if Gemini fails
function getFallbackFAQs(title: string): { question: string; answer: string }[] {
  return [
    {
      question: `What are the main causes of ${title}?`,
      answer: `The main causes vary depending on the specific condition. Generally, factors include diet, environment, genetics, and infectious agents. Consult your veterinarian for a proper diagnosis specific to your situation.`
    },
    {
      question: `How is ${title} typically treated?`,
      answer: `Treatment options depend on the specific diagnosis. Common approaches include medication, dietary changes, supportive care, and in some cases surgery. Always consult a qualified veterinarian for proper treatment.`
    },
    {
      question: `Can ${title} be prevented?`,
      answer: `Many conditions can be prevented through good management practices, proper nutrition, vaccination programs, and regular veterinary check-ups. Early detection is key to successful prevention.`
    },
    {
      question: `When should I call a veterinarian about ${title}?`,
      answer: `You should contact a veterinarian immediately if you notice severe symptoms, sudden changes in behavior, loss of appetite, difficulty breathing, or any signs of distress. Early intervention is crucial.`
    },
    {
      question: `Is ${title} common in my area?`,
      answer: `The prevalence of conditions varies by region. Your local veterinarian will have the best understanding of which conditions are common in your area and can provide specific guidance.`
    }
  ];
}

function FAQAccordion({ content, title }: { content: string; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFAQs() {
      setLoading(true);
      const generatedFaqs = await generateFAQs(content, title);
      setFaqs(generatedFaqs);
      setLoading(false);
    }
    loadFAQs();
  }, [content, title]);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

export default function ArticleClient({ post, prev, next, relatedPosts }: any) {
  const cleanContent = post.content
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Remove FAQ section from content (so it doesn't appear twice)
  let contentWithoutFAQ = cleanContent;
  
  // Remove the entire FAQ section
  contentWithoutFAQ = contentWithoutFAQ.replace(
    /##\s*Frequently Asked Questions About.*?([\s\S]*?)(?=##|$)/i,
    ''
  );
  
  contentWithoutFAQ = contentWithoutFAQ.replace(
    /##\s*Frequently Asked Questions.*$/i,
    ''
  );

  contentWithoutFAQ = contentWithoutFAQ.replace(/\n{3,}/g, '\n\n').trim();

  return (
    <div className="min-h-screen bg-white">
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
            <span className="inline-block bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
          </div>
        )}

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          {post.title}
        </h1>

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
          dangerouslySetInnerHTML={{ __html: contentWithoutFAQ }}
        />

        <FAQAccordion content={cleanContent} title={post.title} />
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

        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Related Articles</h2>
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
