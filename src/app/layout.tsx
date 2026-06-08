import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'VetSphere - Veterinary Care for Livestock & Pets',
  description: 'Professional veterinary services for your animals.',
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'WcTgOlPtjU0VSOKY-8uGBTnceddxZbLtVI_QIGG5jhQ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
