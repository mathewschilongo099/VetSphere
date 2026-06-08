import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) return notFound();

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white py-16 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{post.readTime}</span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-extrabold prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-li:text-gray-600
            prose-strong:text-gray-900
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
            prose-table:text-sm prose-th:bg-gray-100 prose-th:p-2 prose-td:p-2"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Back Link */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <a href="/articles" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline">
          ← Back to Articles
        </a>
      </div>

    </div>
  );
}
