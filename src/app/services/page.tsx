import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services & Free Tools | VetSphere',
  description:
    'Free veterinary learning resources: livestock and pet health guides, the Ask VetAssist AI assistant, quizzes and an academic writing tool.',
  alternates: { canonical: '/services' },
};

const SERVICES = [
  { icon: '🩺', title: 'Veterinary Education', desc: 'Easy-to-read guides on common animal diseases, their signs, prevention and when to call a veterinarian.', href: '/articles', cta: 'Read articles' },
  { icon: '🌾', title: 'Livestock Management', desc: 'Resources for cattle, goat, poultry and pig farmers on feeding, breeding, housing and herd management.', href: '/articles?category=Dairy', cta: 'Browse livestock guides' },
  { icon: '💊', title: 'Disease Prevention', desc: 'Guides on vaccination, biosecurity and early warning signs to help protect your animals.', href: '/articles?category=Animal%20Health', cta: 'Browse animal health' },
  { icon: '🐾', title: 'Pet Care Resources', desc: 'Health, vaccination and nutrition guidance for dog and cat owners.', href: '/articles?category=Pet%20Care', cta: 'Browse pet care' },
  { icon: '🤖', title: 'Ask VetAssist', desc: 'An AI assistant for general animal health questions. It can make mistakes and is not a replacement for a veterinarian.', href: '/ask', cta: 'Ask a question' },
  { icon: '🧠', title: 'Quiz & Academic Writer', desc: 'A learning quiz for students and an AI writing helper for proposals and academic documents.', href: '/quiz', cta: 'Try the quiz' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white py-20 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            What We Offer
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Our Services</h1>
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto">
            Practical veterinary learning resources and tools for farmers, students and pet owners, all free.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How VetSphere Helps You</h2>
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition flex flex-col">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{s.desc}</p>
              <Link href={s.href} className="mt-auto text-green-600 text-sm font-semibold hover:underline">
                {s.cta} →
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-10 max-w-xl mx-auto">
          All content is general educational information, not veterinary advice.{' '}
          <Link href="/disclaimer" className="underline hover:text-green-600">Read the disclaimer</Link>.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to learn more?</h2>
          <p className="text-green-100 mb-8">Browse our free articles or get in touch with any questions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/articles" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition text-center">
              Browse Articles
            </Link>
            <Link href="/contact" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-center">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
