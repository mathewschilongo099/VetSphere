import type { Metadata } from 'next';
import LegalPage, { ContactLine } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | VetSphere',
  description: 'How VetSphere collects, uses and protects information, including cookies and Google AdSense advertising.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 21, 2026">
      <p>
        This Privacy Policy explains how VetSphere ("we", "us") handles information when you visit https://vetsphere.cc.cd. By using the site you agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Information you send us.</strong> When you use the contact form or subscribe to the newsletter, we receive your name, email address and message. These forms are processed by Formspree.</li>
        <li><strong>Questions you ask our tools.</strong> Text you type into Ask VetSphere or the quiz tools is sent to third-party AI providers to generate an answer. Please do not enter personal or sensitive information.</li>
        <li><strong>Automatically collected data.</strong> Our hosting provider (Vercel) and our advertising partners may receive technical data such as IP address, browser type, device type, pages visited and referring page.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To reply to messages and send newsletters you asked for.</li>
        <li>To operate, secure and improve the site and its tools.</li>
        <li>To show advertising that helps keep the site free.</li>
      </ul>

      <h2>Cookies and advertising</h2>
      <p>
        We use Google AdSense to display ads. Third-party vendors, including Google, use cookies to serve ads based on a user's previous visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.
      </p>
      <p>
        You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com" rel="noopener noreferrer">Google Ads Settings</a>. You can also visit <a href="https://www.aboutads.info" rel="noopener noreferrer">aboutads.info</a> to opt out of some third-party vendors' use of cookies for personalized advertising. Learn more about how Google uses data at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>.
      </p>
      <p>
        Where required (for example in the European Economic Area and the United Kingdom), we ask for your consent before personalized ads are shown.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not sell your personal information. We share data only with service providers needed to run the site (hosting, form handling, AI providers, advertising) or when required by law.
      </p>

      <h2>Data retention and your rights</h2>
      <p>
        We keep messages and newsletter subscriptions only as long as needed for the purpose they were sent. You may ask us to access, correct or delete your information, or to unsubscribe, at any time.
      </p>

      <h2>Children</h2>
      <p>VetSphere is not directed to children under 13 and we do not knowingly collect their personal information.</p>

      <h2>External links</h2>
      <p>Articles may link to other websites. We are not responsible for their privacy practices.</p>

      <h2>Changes</h2>
      <p>We may update this policy. The date at the top shows when it was last changed.</p>

      <h2>Contact</h2>
      <ContactLine />
    </LegalPage>
  );
}
