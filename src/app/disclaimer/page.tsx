import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer | VetSphere',
  description: 'VetSphere provides general educational information and does not replace advice from a veterinarian.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Disclaimer</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: November 2026</p>

        <div className="prose prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-green-700">
          <h2>Educational information only</h2>
          <p>
            VetSphere publishes general information about animal health for farmers, students and pet owners. It is not
            a substitute for examination, diagnosis or treatment by a qualified veterinarian.
          </p>

          <h2>In an emergency</h2>
          <p>
            If an animal is seriously ill, injured or showing sudden changes, contact a veterinarian or your local
            veterinary authority straight away. Do not wait for an online answer. For suspected notifiable diseases,
            report to your national veterinary service.
          </p>

          <h2>Medicines and treatment</h2>
          <p>
            Always follow the advice of your veterinarian and the product label for any medicine, dose or withdrawal
            period. Information on this site must not be used to choose or dose drugs.
          </p>

          <h2>How our content is made</h2>
          <p>
            Articles and answers on VetSphere are prepared with the help of AI tools and checked against published
            sources. Despite this, they may contain errors or become out of date. Please confirm important decisions with
            a professional.
          </p>

          <h2>External links and advertising</h2>
          <p>
            We are not responsible for the content of external websites. Advertisements shown on this site are provided
            by third parties. See our <Link href="/privacy">Privacy Policy</Link> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
