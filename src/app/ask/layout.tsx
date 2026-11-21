import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask VetAssist | AI Animal Health Assistant | VetSphere',
  description:
    'Ask VetAssist, the VetSphere AI assistant, general questions about livestock and pet health. Not a substitute for a veterinarian.',
  alternates: { canonical: '/ask' },
};

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
