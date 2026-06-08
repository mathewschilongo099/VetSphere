import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
}

export default function ArticleCard({ post }: ArticleCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100">
      
      {/* Image */}
      <div className="relative h-48 w-full bg-gradient-to-br from-emerald-500 to-teal-600">
        {post.image && (
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {post.category}
          </span>
          <span className="text-xs text-gray-400">{post.readTime}</span>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{post.author}</span>
          <Link
            href={`/articles/${post.slug}`}
            className="text-green-600 font-semibold text-sm hover:underline"
          >
            Read more →
          </Link>
        </div>
      </div>

    </div>
  );
}
