import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'VetSphere - Trusted Veterinary Knowledge for Livestock & Pets',
  description:
    'Expert veterinary articles for farmers and pet owners. Learn about cattle diseases, livestock management, poultry health, dog and cat care — practical, reliable and free.',
  keywords:
    'veterinary, cattle diseases, livestock health, pet care, animal health, poultry farming, goat health, vet articles, livestock farming, dog care, cat care, animal diseases',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'VetSphere - Trusted Veterinary Knowledge for Livestock & Pets',
    description:
      'Expert veterinary articles for farmers and pet owners. Practical, reliable and free.',
    url: 'https://vet-sphere.vercel.app',
    siteName: 'VetSphere',
    type: 'website',
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
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">

        {/* GLOBAL HEADER */}
        <Header />

        {/* PAGE CONTENT */}
        <main className="w-full">{children}</main>

        {/* GLOBAL FOOTER */}
        <Footer />

      </body>
    </html>
  );
}
