'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaClipboardList } from 'react-icons/fa';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
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

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">
            Vet<span className="text-green-600">Sphere</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <a href="/" className="hover:text-green-600 transition">Home</a>
          <a href="/articles" className="hover:text-green-600 transition">Articles</a>
          <a href="/services" className="hover:text-green-600 transition">Services</a>
          <a href="/about" className="hover:text-green-600 transition">About</a>

          {/* QUIZ ICON (NEW FEATURE) */}
          <a
            href="/quiz"
            className="flex items-center gap-1 text-green-600 font-semibold hover:text-green-700 transition"
          >
            <FaClipboardList />
            Quiz
          </a>
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          >
            🔍
          </button>

          <a
            href="/contact"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-sm"
          >
            Contact
          </a>
        </div>

        {/* Mobile Menu Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            🔍
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
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
              className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
            <button className="bg-green-600 text-white px-4 rounded-lg text-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 flex flex-col gap-2 text-gray-700">
            <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="/articles" onClick={() => setMenuOpen(false)}>Articles</a>
            <a href="/services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="/about" onClick={() => setMenuOpen(false)}>About</a>

            {/* QUIZ */}
            <a
              href="/quiz"
              className="text-green-600 font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              🧠 Take Quiz
            </a>

            <a
              href="/contact"
              className="bg-green-600 text-white text-center py-2 rounded-lg mt-2"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
