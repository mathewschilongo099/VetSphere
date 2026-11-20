import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://vetsphere.cc.cd'),
  applicationName: 'VetSphere',
  title: 'VetSphere - Veterinary Knowledge for Livestock & Pets',
  description:
    'Practical veterinary guides for farmers, students and pet owners. Learn about cattle diseases, livestock management, poultry health, dog and cat care. Free to read.',
  keywords:
    'veterinary, cattle diseases, livestock health, pet care, animal health, poultry farming, goat health, vet articles, livestock farming, dog care, cat care, animal diseases',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'VetSphere - Veterinary Knowledge for Livestock & Pets',
    description:
      'Practical veterinary guides for farmers, students and pet owners. Free to read.',
    url: 'https://vetsphere.cc.cd',
    siteName: 'VetSphere',
    type: 'website',
  },
  verification: {
    google: 'WcTgOlPtjU0VSOKY-8uGBTnceddxZbLtVI_QIGG5jhQ',
    other: {
      'google-adsense-account': 'ca-pub-4861447209828693',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4861447209828693"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        <main className="w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
