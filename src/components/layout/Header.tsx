'use client';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-extrabold text-gray-900">Vet<span className="text-green-600">Sphere</span></span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="/" className="hover:text-green-600 transition">Home</a>
          <a href="/articles" className="hover:text-green-600 transition">Articles</a>
          <a href="/services" className="hover:text-green-600 transition">Services</a>
          <a href="/about" className="hover:text-green-600 transition">About</a>
          <a href="/gallery" className="hover:text-green-600 transition">Gallery</a>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/contact" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
            Contact Us
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 w-full">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/articles', label: 'Articles' },
              { href: '/services', label: 'Services' },
              { href: '/about', label: 'About' },
              { href: '/gallery', label: 'Gallery' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="py-3 px-2 text-gray-700 font-medium border-b border-gray-50 hover:text-green-600 transition"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <a
              href="/contact"
              className="mt-3 mb-2 bg-green-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-green-700 transition"
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
