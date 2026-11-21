'use client';
import { useState } from 'react';

const field = 'neo-field w-full rounded-2xl px-4 py-3.5 text-sm';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

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
    <div className="neo-page relative min-h-screen w-full overflow-hidden px-4 py-16">
      <div aria-hidden="true" className="neo-circle pointer-events-none absolute left-[6%] top-[8%] hidden h-48 w-48 sm:block" />
      <div aria-hidden="true" className="neo-circle pointer-events-none absolute bottom-[8%] right-[8%] hidden h-32 w-32 sm:block" />

      <div className="neo-card relative z-10 mx-auto w-full max-w-md p-6 sm:p-9">
        <div
          aria-hidden="true"
          className="neo-raised neo-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </div>

        <h1 className="neo-text text-center text-2xl font-extrabold">Contact Us</h1>
        <p className="neo-muted mb-3 mt-2 text-center text-sm">
          Questions, corrections, article ideas or collaboration? We reply within 24–48 hours.
        </p>
        <p className="neo-muted mb-7 text-center text-xs">
          VetSphere · Lusaka, Zambia
          {CONTACT_EMAIL && (
            <>
              {' · '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {status === 'success' && (
            <div role="status" className="neo-inset neo-accent rounded-2xl p-4 text-sm font-medium">
              Message sent. We’ll get back to you within 24–48 hours.
            </div>
          )}

          {status === 'error' && (
            <div role="alert" className="neo-inset neo-danger rounded-2xl p-4 text-sm font-medium">
              Message not sent. Check your connection and try again.
            </div>
          )}

          <input type="text" name="name" required placeholder="Full name" aria-label="Full name" autoComplete="name" className={field} />
          <input type="email" name="email" required placeholder="Email address" aria-label="Email address" autoComplete="email" className={field} />
          <input type="text" name="subject" required placeholder="Subject" aria-label="Subject" className={field} />
          <textarea name="message" required placeholder="How can we help?" aria-label="Message" className={`${field} h-36 resize-none`} />

          <button type="submit" disabled={status === 'sending'} className="neo-btn neo-accent w-full rounded-2xl py-4 text-base font-bold">
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}
