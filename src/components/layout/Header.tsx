import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">VS</div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">VetSphere</h1>
            <p className="text-xs text-gray-500">Veterinary Care</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-emerald-600 transition-colors">About</Link>
          <Link href="/services" className="hover:text-emerald-600 transition-colors">Services</Link>
          <Link href="/articles" className="hover:text-emerald-600 transition-colors">Articles</Link>
          <Link href="/gallery" className="hover:text-emerald-600 transition-colors">Gallery</Link>
          <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-sm px-4 py-2 rounded-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">Book Appointment</button>
        </div>
      </div>
    </header>
  );
}
