import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
  priority?: boolean;
}

export default function ArticleCard({ post, priority = false }: ArticleCardProps) {
  // Truncate excerpt to ~90 characters
  const truncateText = (text: string, maxLength: number = 90) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link
      href={`/articles/${post.slug}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100 h-full flex flex-col"
    >
      {/* Image - smaller */}
      <div className="relative h-40 w-full bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden">
        {post.image && (
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        )}
      </div>

      {/* Content - tighter spacing */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category & Read Time - one line */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
            {post.category}
          </span>
          <span className="text-[10px] text-gray-400">{post.readTime}</span>
        </div>

        {/* Title - 2 lines max */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-600 transition-colors mb-1">
          {post.title}
        </h3>

        {/* Excerpt - 2 lines max, shorter */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
          {truncateText(post.excerpt || post.description || '')}
        </p>

        {/* Author & Date - one line, smaller */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
          <span className="text-[10px] text-gray-400">{post.author || 'Mathews Chilongo'}</span>
          <span className="text-green-600 font-semibold text-[11px] group-hover:underline">
            Read more →
          </span>
        </div>
      </div>
    </Link>
  );
}
