import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services & Free Tools | VetSphere',
  description:
    'Free veterinary learning resources: livestock and pet health guides, the Ask VetAssist AI assistant, quizzes and an academic writing tool.',
  alternates: { canonical: '/services' },
};

const SERVICES = [
  { icon: '🩺', title: 'Veterinary Education', desc: 'Guides on common animal diseases, signs and prevention.', href: '/articles', cta: 'Read articles' },
  { icon: '🌾', title: 'Livestock Management', desc: 'Feeding, breeding, housing and herd management.', href: '/categories', cta: 'Browse guides' },
  { icon: '💊', title: 'Disease Prevention', desc: 'Vaccination, biosecurity and early warning signs.', href: '/articles?category=Animal%20Health', cta: 'Browse animal health' },
  { icon: '🐾', title: 'Pet Care', desc: 'Health, vaccination and nutrition for dogs and cats.', href: '/articles?category=Pet%20Care', cta: 'Browse pet care' },
  { icon: '🤖', title: 'Ask VetAssist', desc: 'AI assistant for general animal health questions. It can make mistakes.', href: '/ask', cta: 'Ask a question' },
  { icon: '🧠', title: 'Quiz & Academic Writer', desc: 'A learning quiz and an AI writing helper for students.', href: '/quiz', cta: 'Try the quiz' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Title bar (compact) */}
      <section className="bg-green-600 text-white py-4 sm:py-8 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold">Our Services</h1>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-4 py-5 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 bg-green-100 rounded-xl flex items-center justify-center text-xl">{s.icon}</div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-snug mt-0.5 mb-2">{s.desc}</p>
                <Link href={s.href} className="text-green-600 text-sm font-semibold hover:underline">
                  {s.cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-5 max-w-xl mx-auto">
          General educational information, not veterinary advice.{' '}
          <Link href="/disclaimer" className="underline hover:text-green-600">Read the disclaimer</Link>.
        </p>
      </section>

    </div>
  );
}
