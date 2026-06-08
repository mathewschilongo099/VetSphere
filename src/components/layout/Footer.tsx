export default function Footer() {
  return (
    <footer className="bg-green-900 text-white w-full">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <h3 className="text-xl font-extrabold mb-3">🐾 VetSphere</h3>
          <p className="text-green-300 text-sm leading-relaxed">
            Trusted veterinary knowledge for African farmers and pet owners. Practical, reliable, and free.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold mb-3 text-green-200">Quick Links</h4>
          <ul className="space-y-2 text-sm text-green-300">
            <li><a href="/" className="hover:text-white transition">Home</a></li>
            <li><a href="/articles" className="hover:text-white transition">Articles</a></li>
            <li><a href="/services" className="hover:text-white transition">Services</a></li>
            <li><a href="/about" className="hover:text-white transition">About</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold mb-3 text-green-200">Get In Touch</h4>
          <p className="text-sm text-green-300 leading-relaxed">
            Have a question or want to collaborate? Reach out through our contact page.
          </p>
          <a
            href="/contact"
            className="inline-block mt-4 bg-green-600 hover:bg-green-500 text-white text-sm px-5 py-2 rounded-lg transition"
          >
            Contact Us
          </a>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-green-800 py-4 text-center text-green-400 text-xs px-4">
        © 2026 VetSphere Africa. All rights reserved. Caring for your animals with expertise.
      </div>
    </footer>
  );
}
