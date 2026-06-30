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
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-md border-gray-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">
            Vet<span className="text-green-600">Sphere</span>
          </span>
        </a>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <a href="/" className="hover:text-green-600">Home</a>
          <a href="/articles" className="hover:text-green-600">Articles</a>
          <a href="/services" className="hover:text-green-600">Services</a>
          <a href="/about" className="hover:text-green-600">About</a>

          <a href="/ask" className="text-green-600 font-semibold hover:text-green-700">
            🤖 Ask VetAssist
          </a>

          <a href="/quiz" className="text-blue-600 font-semibold hover:text-blue-700">
            🧠 Quiz
          </a>
        </nav>

        {/* RIGHT SIDE (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            🔍
          </button>

          <a
            href="/contact"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
          >
            Contact
          </a>
        </div>

        {/* MOBILE BUTTONS */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            🔍
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      {searchOpen && (
        <div className="border-t bg-white px-4 py-3">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
            <button className="bg-green-600 text-white px-4 rounded-lg text-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {/* MOBILE MENU (FIXED + PREMIUM) */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 flex flex-col gap-2 text-gray-800">

            <a href="/" onClick={() => setMenuOpen(false)} className="py-2 border-b">
              🏠 Home
            </a>

            <a href="/articles" onClick={() => setMenuOpen(false)} className="py-2 border-b">
              📚 Articles
            </a>

            <a href="/services" onClick={() => setMenuOpen(false)} className="py-2 border-b">
              🧰 Services
            </a>

            <a href="/about" onClick={() => setMenuOpen(false)} className="py-2 border-b">
              ℹ️ About
            </a>

            <a
              href="/ask"
              onClick={() => setMenuOpen(false)}
              className="py-3 px-3 rounded-lg bg-green-50 text-green-700 font-semibold"
            >
              🤖 Ask VetAssist
            </a>

            <a
              href="/quiz"
              onClick={() => setMenuOpen(false)}
              className="py-3 px-3 rounded-lg bg-blue-50 text-blue-700 font-semibold"
            >
              🧠 Quiz
            </a>

            <a
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="bg-green-600 text-white text-center py-3 rounded-lg mt-2 font-semibold"
            >
              Contact Us
            </a>

          </div>
        </div>
      )}
    </header>
  );
}
