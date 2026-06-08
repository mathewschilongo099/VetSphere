'use client';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 w-full">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <a href="/" className="text-2xl font-extrabold text-green-700 tracking-tight">
          🐾 VetSphere
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
          <a href="/" className="hover:text-green-700 transition">Home</a>
          <a href="/about" className="hover:text-green-700 transition">About</a>
          <a href="/services" className="hover:text-green-700 transition">Services</a>
          <a href="/articles" className="hover:text-green-700 transition">Articles</a>
          <a href="/gallery" className="hover:text-green-700 transition">Gallery</a>
          <a href="/contact" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">Contact</a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-gray-700 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-700 transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-700 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 flex flex-col gap-3 text-sm font-medium text-gray-700">
          <a href="/" className="py-2 border-b border-gray-100 hover:text-green-700" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="/about" className="py-2 border-b border-gray-100 hover:text-green-700" onClick={() => setMenuOpen(false)}>About</a>
          <a href="/services" className="py-2 border-b border-gray-100 hover:text-green-700" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="/articles" className="py-2 border-b border-gray-100 hover:text-green-700" onClick={() => setMenuOpen(false)}>Articles</a>
          <a href="/gallery" className="py-2 border-b border-gray-100 hover:text-green-700" onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="/contact" className="py-2 text-green-700 font-semibold" onClick={() => setMenuOpen(false)}>Contact</a>
        </div>
      )}
    </header>
  );
}
