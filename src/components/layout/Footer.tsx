export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 w-full">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-1">
          <a href="/" className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-extrabold text-white">Vet<span className="text-green-400">Sphere</span></span>
          </a>
          <p className="text-sm text-gray-400 leading-relaxed">
            Trusted veterinary knowledge for African farmers and pet owners. Practical, reliable, and free.
          </p>
        </div>

        {/* Learn */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Learn</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/articles" className="hover:text-green-400 transition">All Articles</a></li>
            <li><a href="/articles" className="hover:text-green-400 transition">Livestock Health</a></li>
            <li><a href="/articles" className="hover:text-green-400 transition">Pet Care</a></li>
            <li><a href="/articles" className="hover:text-green-400 transition">Disease Prevention</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/about" className="hover:text-green-400 transition">About Us</a></li>
            <li><a href="/services" className="hover:text-green-400 transition">Services</a></li>
            <li><a href="/gallery" className="hover:text-green-400 transition">Gallery</a></li>
            <li><a href="/contact" className="hover:text-green-400 transition">Contact</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Get In Touch</h4>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Have a question or want to collaborate? We'd love to hear from you.
          </p>
          <a
            href="/contact"
            className="inline-block bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Contact Us →
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© 2026 VetSphere Africa. All rights reserved.</p>
          <p>Caring for your animals with expertise 🐄</p>
        </div>
      </div>

    </footer>
  );
}
