'use client';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('sending');

    try {
      const response = await fetch('https://formspree.io/f/mnjyvdby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, _subject: 'New Newsletter Subscription' }),
      });

      if (response.ok) {
        setSubStatus('success');
        setEmail('');
      } else {
        setSubStatus('error');
      }
    } catch {
      setSubStatus('error');
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300 w-full">

      {/* Newsletter Section */}
      <div className="bg-green-700 w-full py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-extrabold text-white mb-2">Stay Updated 🐾</h3>
          <p className="text-green-100 text-sm mb-6">
            Subscribe to receive the latest veterinary articles and animal health tips — straight to your inbox. Free forever.
          </p>

          {subStatus === 'success' ? (
            <div className="bg-green-600 border border-green-500 text-white rounded-xl px-6 py-3 text-sm font-medium inline-block">
              ✅ Subscribed successfully! Welcome to VetSphere.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                disabled={subStatus === 'sending'}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition shrink-0"
              >
                {subStatus === 'sending' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}

          {subStatus === 'error' && (
            <p className="text-red-300 text-xs mt-3">Something went wrong. Please try again.</p>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-1">
          <a href="/" className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-extrabold text-white">Vet<span className="text-green-400">Sphere</span></span>
          </a>
          <p className="text-sm text-gray-400 leading-relaxed">
            Trusted veterinary knowledge for farmers and pet owners worldwide. Practical, reliable, and free.
          </p>
        </div>

        {/* Learn */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Learn</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/articles" className="hover:text-green-400 transition">All Articles</a></li>
            <li><a href="/articles?category=livestock" className="hover:text-green-400 transition">Livestock Health</a></li>
            <li><a href="/articles?category=pets" className="hover:text-green-400 transition">Pet Care</a></li>
            <li><a href="/articles?category=disease-prevention" className="hover:text-green-400 transition">Disease Prevention</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/about" className="hover:text-green-400 transition">About Us</a></li>
            <li><a href="/services" className="hover:text-green-400 transition">Services</a></li>
            <li><a href="/contact" className="hover:text-green-400 transition">Contact</a></li>
          </ul>
        </div>

        {/* Get In Touch */}
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
          <p>© 2026 VetSphere. All rights reserved.</p>
          <p>Caring for your animals with expertise 🐄</p>
        </div>
      </div>

    </footer>
  );
}
