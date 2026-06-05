'use client';

import { useState } from 'react';
import { FiMail, FiCheck } from 'react-icons/fi';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setSubmitted(true);
        setEmail('');
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setError('Please enter a valid email address');
      }
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg p-6 md:p-8">
      <div className="max-w-md">
        <h3 className="text-xl md:text-2xl font-bold mb-2">Stay Updated</h3>
        <p className="text-sm opacity-90 mb-6">
          Get the latest veterinary insights and animal care tips delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FiMail className="absolute left-3 top-3 text-gray-300" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {submitted ? <FiCheck /> : isLoading ? '...' : 'Subscribe'}
            </button>
          </div>

          {error && <p className="text-sm text-red-200">{error}</p>}
          {submitted && <p className="text-sm text-green-200">✓ Thank you for subscribing!</p>}
        </form>

        <p className="text-xs opacity-75 mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
}
