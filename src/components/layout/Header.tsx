'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">
            Vet<span className="text-green-600">Sphere</span>
          </span>
        </a>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <a href="/">Home</a>
          <a href="/articles">Articles</a>
          <a href="/services">Services</a>
          <a href="/about">About</a>
          <a href="/ask" className="text-green-600 font-semibold">Ask VetAssist</a>
          <a href="/quiz" className="text-blue-600 font-semibold">Quiz</a>
        </nav>

        {/* DESKTOP RIGHT */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            🔍
          </button>

          <a
            href="/contact"
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold"
          >
            Contact
          </a>
        </div>

        {/* MOBILE RIGHT (FIXED ICON VISIBILITY) */}
        <div className="flex md:hidden items-center gap-3">

          {/* SEARCH ICON */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-900"
          >
            🔍
          </button>

          {/* HAMBURGER (FIXED VISIBILITY) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
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
              className="flex-1 px-4 py-2 border rounded-lg text-sm"
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
          <div className="px-4 py-3 flex flex-col gap-2 text-gray-800">

            <a href="/" onClick={() => setMenuOpen(false)}>🏠 Home</a>
            <a href="/articles" onClick={() => setMenuOpen(false)}>📚 Articles</a>
            <a href="/services" onClick={() => setMenuOpen(false)}>🧰 Services</a>
            <a href="/about" onClick={() => setMenuOpen(false)}>ℹ️ About</a>

            <a href="/ask" className="text-green-600 font-semibold">
              🤖 Ask VetAssist
            </a>

            <a href="/quiz" className="text-blue-600 font-semibold">
              🧠 Quiz
            </a>

            <a
              href="/contact"
              className="bg-green-600 text-white text-center py-3 rounded-lg mt-2"
            >
              Contact Us
            </a>

          </div>
        </div>
      )}
    </header>
  );
}
