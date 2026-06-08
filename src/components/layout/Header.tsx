'use client';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-emerald-600">VetSphere</div>
        <div className="flex gap-8">
          <a href="/" className="hover:text-emerald-600">Home</a>
          <a href="/about" className="hover:text-emerald-600">About</a>
          <a href="/services" className="hover:text-emerald-600">Services</a>
          <a href="/articles" className="hover:text-emerald-600">Articles</a>
          <a href="/gallery" className="hover:text-emerald-600">Gallery</a>
          <a href="/contact" className="hover:text-emerald-600">Contact</a>
        </div>
      </nav>
    </header>
  );
}
