import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact VetSphere | Questions, Corrections & Collaboration',
  description:
    'Get in touch with VetSphere for questions, article corrections, ideas or collaboration. We reply within 24 to 48 hours.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
