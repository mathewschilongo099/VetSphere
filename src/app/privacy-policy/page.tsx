import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout from '@/components/ui/LegalLayout';
import { CONTACT_EMAIL, LAST_UPDATED, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy | VetSphere',
  description:
    'How VetSphere collects, uses and protects information, including cookies and Google AdSense advertising.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated={LAST_UPDATED}>
      <p>
        This policy explains how VetSphere ({SITE_URL.replace('https://', '')}), operated by Mathews
        Chilongo, handles information when you visit the site. By using the site you agree to this
        policy.
      </p>

      <h2>Information you give us</h2>
      <ul>
        <li>
          <strong>Contact form:</strong> your name, email address, subject and message, so we can reply
          to you.
        </li>
        <li>
          <strong>Newsletter:</strong> your email address, so we can send veterinary articles and tips.
          You can ask to be removed at any time.
        </li>
        <li>
          <strong>AI tools (Ask VetAssist, Quiz, Academic Writer):</strong> the questions and text you
          type are sent to third-party AI providers to produce a response. Please do not enter personal,
          financial or confidential information.
        </li>
      </ul>
      <p>
        Forms are processed by Formspree, which stores and forwards the submission to us. We do not
        sell your personal information.
      </p>

      <h2>Information collected automatically</h2>
      <p>
        Our hosting provider (Vercel) and our servers may record technical data such as your IP
        address, browser type, pages requested and time of visit. We use IP addresses briefly to
        protect the AI tools from abuse (rate limiting) and to keep the site secure.
      </p>

      <h2>Cookies and advertising</h2>
      <p>
        VetSphere shows ads served by Google AdSense. Third-party vendors, including Google, use
        cookies and similar technologies to serve ads based on your previous visits to this and other
        websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to
        you based on your visit to our site and other sites on the internet.
      </p>
      <ul>
        <li>
          You can opt out of personalised advertising at{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>{' '}
          or at{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>
          .
        </li>
        <li>
          Learn how Google uses data from sites that use its services at{' '}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            policies.google.com/technologies/partner-sites
          </a>
          .
        </li>
        <li>
          Visitors in the European Economic Area, the United Kingdom and Switzerland may be shown a
          consent message so they can choose how cookies are used for ads.
        </li>
        <li>You can also block or delete cookies in your browser settings.</li>
      </ul>

      <h2>Third-party services we use</h2>
      <ul>
        <li>Google AdSense (advertising)</li>
        <li>Formspree (contact and newsletter forms)</li>
        <li>Vercel (hosting)</li>
        <li>AI providers such as Google and Groq (to generate answers in our AI tools)</li>
      </ul>
      <p>These services have their own privacy policies, which we do not control.</p>

      <h2>Your choices</h2>
      <p>
        You may ask us to access, correct or delete the personal information you have sent us, or to
        remove you from the newsletter, by using our <Link href="/contact">contact page</Link>
        {CONTACT_EMAIL ? (
          <>
            {' '}or by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </>
        ) : null}
        .
      </p>

      <h2>Children</h2>
      <p>
        VetSphere is not directed at children under 13 and we do not knowingly collect their personal
        information.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The date at the top shows when it was last
        changed.
      </p>
    </LegalLayout>
  );
}
