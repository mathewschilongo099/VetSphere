import type { Metadata } from 'next';

// The admin area is private: keep it out of search results.
export const metadata: Metadata = {
  title: 'VetSphere Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
