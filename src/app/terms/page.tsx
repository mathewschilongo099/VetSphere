import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout from '@/components/ui/LegalLayout';
import { LAST_UPDATED } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Use | VetSphere',
  description: 'The terms that apply when you use VetSphere, its articles and its AI tools.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use" updated={LAST_UPDATED}>
      <p>
        By using VetSphere you agree to these terms. If you do not agree, please do not use the site.
      </p>

      <h2>Educational purpose</h2>
      <p>
        Everything on VetSphere is general educational information. It is not veterinary, medical,
        legal or professional advice. Please read our <Link href="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>AI tools</h2>
      <p>
        Ask VetAssist, the Quiz and the Academic Writer use artificial intelligence. Their output can
        be incomplete or wrong, so check important facts with a qualified professional and the
        sources you cite. Do not enter personal or confidential information.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to break, overload or gain unauthorised access to the site or its tools.</li>
        <li>Do not use automated scripts to bulk-copy content or drain the AI tools.</li>
        <li>Do not use the site for anything unlawful, harmful or abusive.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        Articles, design and branding on VetSphere belong to VetSphere unless stated otherwise. You
        may link to our pages and quote short excerpts with clear credit and a link back. Please do
        not republish full articles without written permission. Third-party images remain the
        property of their owners.
      </p>

      <h2>Links and advertising</h2>
      <p>
        The site may link to other websites and shows ads from Google AdSense. We do not control or
        endorse third-party sites, products or advertisers.
      </p>

      <h2>No warranty and limit of liability</h2>
      <p>
        The site and its content are provided as is, without warranties of any kind. To the fullest
        extent allowed by law, VetSphere and its owner are not liable for any loss or harm arising
        from your use of, or reliance on, the site or its tools.
      </p>

      <h2>Changes</h2>
      <p>
        We may change these terms or the site at any time. Continuing to use VetSphere after a change
        means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Use our <Link href="/contact">contact page</Link>.
      </p>
    </LegalLayout>
  );
}
