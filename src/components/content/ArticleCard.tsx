import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
}

export function ArticleCard({ post }: ArticleCardProps) {
  return (
    <Link href={`/articles/${post.slug}`} className="group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800">
      <div className="relative h-48">
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
          {post.readingTime} min read
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider text-primary dark:text-blue-400">
          {post.category}
        </div>

        <h3 className="font-semibold text-xl leading-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 text-sm">
          {post.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <span>{post.author}</span>
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
        </div>
      </div>
    </Link>
  );
}
