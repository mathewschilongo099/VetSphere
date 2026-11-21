import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Ask VetAssist – AI Animal Health Assistant | VetSphere',
  description:
    'Ask our AI assistant general questions about livestock and pet health. For emergencies, always contact a licensed veterinarian.',
  alternates: { canonical: '/ask' },
};

export default function AskLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
