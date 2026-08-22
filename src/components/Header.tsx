'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">Vet<span className="text-green-600">Sphere</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-green-600 transition">Home</Link>
          <Link href="/articles" className="hover:text-green-600 transition">Articles</Link>
          <Link href="/services" className="hover:text-green-600 transition">Services</Link>
          <Link href="/quiz" className="hover:text-green-600 transition font-medium text-green-700">🩺 Quiz</Link>
          <Link href="/about" className="hover:text-green-600 transition">About</Link>
          <Link href="/ask" className="hover:text-green-600 transition text-green-600 font-semibold">Ask VetAssist</Link>
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <Link href="/contact" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
            Contact Us
          </Link>
        </div>

        {/* Mobile Right */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 w-full">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles... e.g. cattle diseases, poultry health"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 w-full">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/articles', label: 'Articles' },
              { href: '/services', label: 'Services' },
              { href: '/quiz', label: '🩺 Symptom Checker' },
              { href: '/about', label: 'About' },
              { href: '/ask', label: '🤖 Ask VetAssist' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="py-3 px-2 text-gray-700 font-medium border-b border-gray-50 hover:text-green-600 transition"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-3 mb-2 bg-green-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-green-700 transition"
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
