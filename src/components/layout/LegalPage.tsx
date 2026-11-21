import type { ReactNode } from 'react';

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function ContactLine() {
  return CONTACT_EMAIL ? (
    <p>
      Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or use our <a href="/contact">contact form</a>.
    </p>
  ) : (
    <p>
      Use our <a href="/contact">contact form</a>.
    </p>
  );
}

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <section className="bg-gray-900 text-white py-14 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold">{title}</h1>
          <p className="text-gray-400 text-sm mt-3">Last updated: {updated}</p>
        </div>
      </section>
      <article className="max-w-3xl mx-auto px-4 py-12 prose prose-sm sm:prose-base prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-green-600">
        {children}
      </article>
    </div>
  );
}
