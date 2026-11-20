'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PawPrint } from 'lucide-react';

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
      {/* Newsletter */}
      <div className="bg-green-700 w-full py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-extrabold text-white mb-2">Stay updated</h3>
          <p className="text-green-100 text-sm mb-6">
            Get new veterinary articles and animal health tips by email. Free, and you can stop at any time.
          </p>

          {subStatus === 'success' ? (
            <div className="bg-green-600 border border-green-500 text-white rounded-xl px-6 py-3 text-sm font-medium inline-block">
              Thank you for subscribing to VetSphere.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Email address"
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
            <p className="text-red-200 text-xs mt-3">Something went wrong. Please try again.</p>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4" aria-label="VetSphere home">
            <PawPrint className="w-6 h-6 text-green-400" aria-hidden="true" />
            <span className="text-xl font-extrabold text-white">
              Vet<span className="text-green-400">Sphere</span>
            </span>
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed">
            Free veterinary guides for livestock farmers, students and pet owners.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Learn</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/articles" className="hover:text-green-400 transition">All Articles</Link></li>
            <li><Link href="/ask" className="hover:text-green-400 transition">Ask VetAssist</Link></li>
            <li><Link href="/quiz" className="hover:text-green-400 transition">Quiz</Link></li>
            <li><Link href="/academic-writer" className="hover:text-green-400 transition">Academic Writer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-green-400 transition">About Us</Link></li>
            <li><Link href="/services" className="hover:text-green-400 transition">Services</Link></li>
            <li><Link href="/contact" className="hover:text-green-400 transition">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-green-400 transition">Privacy Policy</Link></li>
            <li><Link href="/disclaimer" className="hover:text-green-400 transition">Disclaimer</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} VetSphere. All rights reserved.</p>
          <p>For education only. It does not replace advice from a veterinarian.</p>
        </div>
      </div>
    </footer>
  );
}
