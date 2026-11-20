'use client';
import { useState } from 'react';

// Explicit text/background colors on every field so typed text stays visible
// even when the site is in dark mode (body sets text-white there).
const field =
  'w-full rounded-2xl bg-[#e6e9ef] px-4 py-3.5 text-sm text-[#2b3040] caret-[#2b3040] ' +
  'placeholder:text-[#8a91a3] outline-none [color-scheme:light] ' +
  'shadow-[inset_5px_5px_10px_#c5cad6,inset_-5px_-5px_10px_#ffffff] ' +
  'focus-visible:ring-2 focus-visible:ring-green-600 ' +
  '[&:-webkit-autofill]:[-webkit-text-fill-color:#2b3040] ' +
  '[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#e6e9ef_inset]';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/mnjyvdby', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#e6e9ef] px-4 py-16 text-[#2b3040]">
      {/* Floating circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[6%] top-[8%] hidden h-48 w-48 rounded-full bg-[#e6e9ef] shadow-[12px_12px_24px_#c5cad6,-12px_-12px_24px_#ffffff] sm:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[8%] right-[8%] hidden h-32 w-32 rounded-full bg-[#e6e9ef] shadow-[12px_12px_24px_#c5cad6,-12px_-12px_24px_#ffffff] sm:block"
      />

      <div className="relative z-10 mx-auto w-full max-w-md rounded-[28px] bg-[#e6e9ef] p-6 shadow-[14px_14px_30px_#c5cad6,-14px_-14px_30px_#ffffff] sm:p-9">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6e9ef] text-green-700 shadow-[6px_6px_12px_#c5cad6,-6px_-6px_12px_#ffffff]"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </div>

        <h1 className="text-center text-2xl font-extrabold text-[#2b3040]">Contact Us</h1>
        <p className="mb-7 mt-2 text-center text-sm text-[#8a91a3]">
          Questions, article ideas or collaboration? We reply within 24–48 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {status === 'success' && (
            <div
              role="status"
              className="rounded-2xl bg-[#e6e9ef] p-4 text-sm font-medium text-green-700 shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff]"
            >
              Message sent. We’ll get back to you within 24–48 hours.
            </div>
          )}

          {status === 'error' && (
            <div
              role="alert"
              className="rounded-2xl bg-[#e6e9ef] p-4 text-sm font-medium text-red-600 shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff]"
            >
              Message not sent. Check your connection and try again.
            </div>
          )}

          <input
            type="text"
            name="name"
            required
            placeholder="Full name"
            aria-label="Full name"
            autoComplete="name"
            className={field}
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email address"
            aria-label="Email address"
            autoComplete="email"
            className={field}
          />
          <input
            type="text"
            name="subject"
            required
            placeholder="Subject"
            aria-label="Subject"
            className={field}
          />
          <textarea
            name="message"
            required
            placeholder="How can we help?"
            aria-label="Message"
            className={`${field} h-36 resize-none`}
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-2xl bg-[#e6e9ef] py-4 text-base font-bold text-green-700 shadow-[6px_6px_12px_#c5cad6,-6px_-6px_12px_#ffffff] transition-shadow hover:shadow-[8px_8px_16px_#c5cad6,-8px_-8px_16px_#ffffff] active:shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}
