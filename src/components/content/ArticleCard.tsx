import Link from 'next/link';

import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
}

export default function ArticleCard({ post }: ArticleCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
      <div className="h-48 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      </div>
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <span className="text-xs px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-full">{post.category}</span>
          <span className="text-xs text-gray-500">{post.readTime}</span>
        </div>
        <h3 className="font-semibold text-xl mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">{post.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
        <Link href={`/articles/${post.slug}`} className="text-emerald-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
          Read full article →
        </Link>
      </div>
    </div>
  );
}
