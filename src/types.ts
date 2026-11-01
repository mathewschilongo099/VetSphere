export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image: string;
  imageAlt: string;
  content: string;
  /** Questions and answers taken from the article's FAQ section (answers are HTML). */
  faqs?: { question: string; answerHtml: string }[];
  readingTime: number;
  readTime: string;
  featured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}
