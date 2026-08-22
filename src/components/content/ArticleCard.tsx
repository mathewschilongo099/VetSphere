import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';

interface ArticleCardProps {
  post: BlogPost;
  priority?: boolean; // NEW
}

export default function ArticleCard({ post, priority = false }: ArticleCardProps) {
  const truncateText = (text: string, maxLength: number = 90) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link
      href={`/articles/${post.slug}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-gray-100 h-full flex flex-col"
    >
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
      {/* ...rest unchanged... */}
    </Link>
  );
}
