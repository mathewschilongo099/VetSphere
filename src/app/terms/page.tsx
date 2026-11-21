import type { Metadata } from 'next';
import LegalPage, { ContactLine } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Use | VetSphere',
  description: 'The terms that apply when you use VetSphere articles, tools and services.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="November 21, 2026">
      <p>By accessing VetSphere you agree to these terms. If you do not agree, please do not use the site.</p>

      <h2>Educational use only</h2>
      <p>
        All content is general educational information. It is not a veterinary diagnosis, prescription or substitute for examination by a licensed veterinarian. See our <a href="/disclaimer">Veterinary Disclaimer</a>.
      </p>

      <h2>AI tools</h2>
      <p>
        Ask VetSphere, quizzes and similar features use artificial intelligence and can be wrong or incomplete. Do not rely on them for emergencies or treatment decisions.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to disrupt, overload or gain unauthorized access to the site or its APIs.</li>
        <li>Do not scrape the site at a rate that harms performance, or use our tools to generate spam or unlawful content.</li>
        <li>Do not click on ads for any reason other than genuine interest.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        Articles and site design are owned by VetSphere unless stated otherwise. You may quote short excerpts with a link back to the original page. Stock photos belong to their respective photographers and providers.
      </p>

      <h2>Advertising and affiliate links</h2>
      <p>
        The site displays advertising and may contain affiliate links. We may earn a commission if you buy through them, at no extra cost to you. Sponsored or affiliate content will be identified.
      </p>

      <h2>No warranty and limitation of liability</h2>
      <p>
        The site is provided "as is". To the fullest extent permitted by law, VetSphere is not liable for any loss or harm to animals, people or property arising from use of, or reliance on, the site.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms at any time. Continued use means you accept the updated terms.</p>

      <h2>Contact</h2>
      <ContactLine />
    </LegalPage>
  );
}
