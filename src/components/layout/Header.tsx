'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Articles' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
];

const TOOLS = [
  { href: '/ask', label: 'Ask VetAssist' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/academic-writer', label: 'Academic Writer' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-md border-gray-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2" aria-label="VetSphere home">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">
            Vet<span className="text-green-600">Sphere</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-green-600 transition">
              {item.label}
            </Link>
          ))}
          {TOOLS.map((item) => (
            <Link key={item.href} href={item.href} className="text-green-700 font-semibold hover:text-green-500 transition">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* DESKTOP RIGHT */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search articles"
            aria-expanded={searchOpen}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            🔍
          </button>

          <Link
            href="/contact"
            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-semibold transition"
          >
            Contact
          </Link>
        </div>

        {/* MOBILE RIGHT */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search articles"
            aria-expanded={searchOpen}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-900"
          >
            🔍
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="p-2 rounded-lg bg-gray-100 text-gray-900 shadow-sm"
          >
            ☰
          </button>
        </div>
      </div>

      {/* SEARCH */}
      {searchOpen && (
        <div className="border-t bg-white px-4 py-3">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              aria-label="Search articles"
              className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-900"
            />
            <button className="bg-green-600 text-white px-4 rounded-lg text-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 flex flex-col gap-3 text-gray-800">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </Link>
            ))}
            {TOOLS.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu} className="text-green-700 font-semibold">
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="bg-green-600 text-white text-center py-3 rounded-lg mt-2"
              onClick={closeMenu}
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
