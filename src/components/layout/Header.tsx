'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">
            Vet<span className="text-green-600">Sphere</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">

          <a href="/" className="hover:text-green-600 transition">Home</a>
          <a href="/articles" className="hover:text-green-600 transition">Articles</a>

          {/* ✅ QUIZ BUTTON ADDED HERE */}
          <a
            href="/quiz"
            className="text-green-600 font-semibold hover:text-green-700 transition"
          >
            🎓 Quiz
          </a>

          <a href="/services" className="hover:text-green-600 transition">Services</a>
          <a href="/about" className="hover:text-green-600 transition">About</a>
          <a href="/ask" className="hover:text-green-600 transition text-green-600 font-semibold">
            Ask VetAssist
          </a>
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
            aria-label="Search"
          >
            🔍
          </button>

          <a
            href="/contact"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Contact Us
          </a>
        </div>

        {/* Mobile Right */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
          >
            🔍
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
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
              placeholder="Search articles..."
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm"
              autoFocus
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 flex flex-col gap-2">

            <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="/articles" onClick={() => setMenuOpen(false)}>Articles</a>

            {/* ✅ QUIZ MOBILE LINK */}
            <a
              href="/quiz"
              className="text-green-600 font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              🎓 Quiz
            </a>

            <a href="/services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="/about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="/ask" onClick={() => setMenuOpen(false)}>Ask VetAssist</a>

            <a
              href="/contact"
              className="bg-green-600 text-white text-center py-3 rounded-xl mt-2"
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
