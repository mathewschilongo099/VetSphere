import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
  priority?: boolean;
}

export default function ArticleCard({ post, priority = false }: ArticleCardProps) {
  // Older articles have descriptions that were cut off with "...". CSS line-clamp
  // already limits the excerpt to two lines, so the stray ellipsis is removed.
  const excerpt = (post.excerpt || post.description || '').replace(/\s*(\.{3}|…)\s*$/, '');

  return (
    <Link
      href={`/articles/${post.slug}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100 h-full flex flex-col"
    >
      <div className="relative h-44 w-full bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden">
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

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {post.category && (
            <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
              {post.category}
            </span>
          )}
          <span className="text-xs text-gray-500">{post.readTime}</span>
        </div>

        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-600 transition-colors mb-2">
          {post.title}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1">
          {excerpt}
        </p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{post.author || 'VetSphere'}</span>
          <span className="text-green-600 font-semibold text-sm group-hover:underline">
            Read more
          </span>
        </div>
      </div>
    </Link>
  );
}
