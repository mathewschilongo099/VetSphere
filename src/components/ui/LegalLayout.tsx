import type { ReactNode } from 'react';

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {updated}</p>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-green-700 [&_a]:underline">
          {children}
        </div>
      </div>
    </div>
  );
}
