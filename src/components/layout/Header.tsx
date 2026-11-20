'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, PawPrint, Search, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Articles' },
  { href: '/ask', label: 'Ask VetAssist' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/academic-writer', label: 'Academic Writer' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-gray-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="VetSphere home">
          <PawPrint className="w-6 h-6 text-green-600" aria-hidden="true" />
          <span className="text-xl font-extrabold text-gray-900">
            Vet<span className="text-green-600">Sphere</span>
          </span>
        </Link>

        {/* Desktop navigation (large screens only, so it never gets cramped) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`transition-colors ${
                isActive(link.href)
                  ? 'text-green-700 font-semibold'
                  : 'text-gray-700 hover:text-green-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Search articles"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>

          <Link
            href="/contact"
            className="hidden sm:inline-block bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            Contact
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-900"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Search */}
      {searchOpen && (
        <div className="border-t bg-white px-4 py-3">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              aria-label="Search articles"
              autoFocus
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button className="bg-green-600 hover:bg-green-500 text-white px-5 rounded-lg text-sm font-semibold transition">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile and tablet menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          <nav className="px-4 py-3 flex flex-col text-gray-800" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`py-3 border-b border-gray-100 text-base ${
                  isActive(link.href) ? 'text-green-700 font-semibold' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="bg-green-600 text-white text-center py-3 rounded-lg mt-4 font-semibold"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
