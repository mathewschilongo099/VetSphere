import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
}

export default function ArticleCard({ post }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100"
    >

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
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[11px] px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
            {post.category}
          </span>
          <span className="text-[11px] text-gray-400">{post.readTime}</span>
        </div>
        <h3 className="font-bold text-gray-900 visited:text-gray-900 text-base mb-1.5 line-clamp-2 group-hover:text-green-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-500 text-[13px] line-clamp-3 mb-3 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">{post.author}</span>
          <span className="text-green-600 font-semibold text-[13px] group-hover:underline">
            Read more →
          </span>
        </div>
      </div>

    </Link>
  );
}
