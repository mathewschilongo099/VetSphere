import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | VetSphere',
  description: 'How VetSphere handles visitor information, cookies, advertising and third-party services.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: November 2026</p>

        <div className="prose prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-green-700">
          <p>
            VetSphere (&quot;we&quot;, &quot;us&quot;) is a free veterinary information website at vetsphere.cc.cd. This page
            explains what information is collected when you use the site and how it is used.
          </p>

          <h2>Information you give us</h2>
          <ul>
            <li>
              <strong>Newsletter and contact forms.</strong> If you subscribe or send a message, we receive the email
              address and any details you type. These forms are processed by Formspree.
            </li>
            <li>
              <strong>Questions you ask.</strong> Text you enter in the Ask VetSphere, VetAssist or quiz tools is sent to
              third-party AI services so an answer can be generated. Please do not include personal or sensitive
              information in your questions.
            </li>
          </ul>

          <h2>Information collected automatically</h2>
          <p>
            Like most websites, our hosting provider (Vercel) and our advertising partner collect technical data such as
            your IP address, browser type, device type and the pages you visit.
          </p>

          <h2>Cookies and advertising</h2>
          <p>
            VetSphere uses Google AdSense to show advertisements. Google and its partners may use cookies to show ads
            based on your visits to this and other websites. You can manage or opt out of personalised advertising at{' '}
            <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">Google Ads Settings</a>, and
            you can control cookies in your browser settings.
          </p>

          <h2>How we use information</h2>
          <ul>
            <li>To answer your questions and reply to your messages</li>
            <li>To send newsletter emails, if you subscribed</li>
            <li>To keep the site secure and working properly</li>
          </ul>
          <p>We do not sell your personal information.</p>

          <h2>Your choices</h2>
          <p>
            You can ask us to remove your email address from our records at any time through the{' '}
            <Link href="/contact">contact page</Link>.
          </p>

          <h2>Changes to this policy</h2>
          <p>We may update this page from time to time. The date at the top shows when it was last changed.</p>

          <h2>Contact</h2>
          <p>
            Questions about this policy can be sent through the <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
