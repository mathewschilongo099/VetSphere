import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'VetSphere Africa - Veterinary Care & Livestock Management',
  description: 'Expert veterinary advice, livestock farming tips, and pet care resources for Africa.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
