import type { Metadata } from 'next';
import LegalPage, { ContactLine } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Veterinary Disclaimer | VetSphere',
  description: 'VetSphere provides educational animal health information, not veterinary diagnosis or treatment.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Veterinary Disclaimer" updated="November 21, 2026">
      <p>
        VetSphere publishes general information about livestock and pet health for education. It does not create a veterinarian-client-patient relationship.
      </p>

      <h2>Not a substitute for a veterinarian</h2>
      <p>
        Do not use this site to diagnose or treat an animal. Drug choices, doses, vaccination programs and withdrawal periods vary by species, country and product label. Always follow the advice of a licensed veterinarian and the product label.
      </p>

      <h2>Emergencies</h2>
      <p>
        If an animal is collapsed, struggling to breathe, bleeding heavily, bloated, unable to stand, or several animals are suddenly sick or dying, contact a veterinarian or your national veterinary authority immediately. Do not wait for information from a website.
      </p>

      <h2>Notifiable diseases</h2>
      <p>
        Some diseases discussed here (for example foot-and-mouth disease, anthrax, African swine fever and avian influenza) must be reported to the authorities. Follow local law.
      </p>

      <h2>Accuracy</h2>
      <p>
        We aim for accurate, up-to-date content and list general reference sources at the end of articles, but veterinary knowledge and regulations change. We make no guarantee of completeness. Report errors through the contact page and we will review them.
      </p>

      <h2>Contact</h2>
      <ContactLine />
    </LegalPage>
  );
}
