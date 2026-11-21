import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout from '@/components/ui/LegalLayout';
import { LAST_UPDATED } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Veterinary & Content Disclaimer | VetSphere',
  description:
    'VetSphere provides general animal health education, not veterinary advice. Read how our content and AI tools should be used.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" updated={LAST_UPDATED}>
      <h2>Not veterinary advice</h2>
      <p>
        VetSphere publishes general information about livestock and pet health for education. It does
        not diagnose or treat any animal, and reading it does not create a veterinarian-client
        relationship. Always consult a qualified veterinarian about the health of your animals.
      </p>

      <h2>Emergencies</h2>
      <p>
        If an animal is collapsing, struggling to breathe, bleeding heavily, bloated, unable to stand
        or showing sudden severe signs, contact a veterinarian or your local veterinary authority
        immediately. Do not wait for an online answer. Many livestock diseases must be reported to
        the authorities.
      </p>

      <h2>Medicines, doses and local rules</h2>
      <p>
        Drug availability, legal status, withdrawal periods and disease-control rules differ between
        countries. Follow the product label and the instructions of your veterinarian. Never use
        human medicines or leftover products on animals without veterinary guidance.
      </p>

      <h2>How our content is made</h2>
      <p>
        Some articles and all answers in our AI tools are produced with the help of artificial
        intelligence, using published material from sources such as WOAH, FAO, national veterinary
        services, research institutes and the Merck Veterinary Manual. We use checks to catch errors,
        but mistakes are still possible and information can become out of date. See{' '}
        <Link href="/about#editorial">how we work</Link>.
      </p>

      <h2>Accuracy and corrections</h2>
      <p>
        If you spot an error or outdated information, please tell us through the{' '}
        <Link href="/contact">contact page</Link> and we will review it.
      </p>

      <h2>Advertising and external links</h2>
      <p>
        VetSphere displays ads served by Google AdSense. Ads and linked websites are not
        recommendations or endorsements by VetSphere.
      </p>

      <p>
        See also our <Link href="/privacy-policy">Privacy Policy</Link> and{' '}
        <Link href="/terms">Terms of Use</Link>.
      </p>
    </LegalLayout>
  );
}
