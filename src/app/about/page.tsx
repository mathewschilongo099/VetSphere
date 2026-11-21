import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About VetSphere | Veterinary Knowledge for Farmers & Pet Owners',
  description:
    'Learn who runs VetSphere, how our veterinary guides are researched and checked, and how to report a correction.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { icon: '🎯', title: 'Our Mission', desc: 'Accurate veterinary knowledge and practical tools for better animal health.' },
  { icon: '👁️', title: 'Our Vision', desc: 'Free, reliable veterinary guidance for every farmer and pet owner.' },
  { icon: '🐄', title: 'Livestock', desc: 'Cattle, goats, poultry and pigs: prevention, nutrition and management.' },
  { icon: '🐾', title: 'Pet Care', desc: 'Keeping dogs, cats and small animals healthy.' },
  { icon: '🌍', title: 'Worldwide', desc: 'Rooted in African veterinary challenges, useful across the globe.' },
  { icon: '💡', title: 'Always Free', desc: 'All articles and resources are free to read.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Title bar (compact) */}
      <section className="bg-gray-900 text-white py-4 sm:py-8 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold">About VetSphere</h1>
        </div>
      </section>

      {/* Founder */}
      <section className="max-w-4xl mx-auto px-4 pt-5 pb-4 sm:pt-10 sm:pb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shrink-0 border-4 border-green-500">
            <Image
              src="/images/articles/mathews.jpg"
              alt="Mathews Chilongo, founder of VetSphere"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-green-600 text-[11px] font-semibold uppercase tracking-widest">Founder &amp; Author</p>
            <h2 className="text-xl font-extrabold text-gray-900">Mathews Chilongo</h2>
            <p className="text-green-600 text-sm font-medium mb-2">Veterinary Practitioner &amp; Freelancer</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              I created VetSphere to make reliable veterinary knowledge accessible to everyone, from farmers in rural Africa to pet owners in the city. My goal is practical, accurate and free information that helps you care for your animals.
            </p>
          </div>
        </div>
      </section>

      {/* How we work */}
      <section id="editorial" className="max-w-4xl mx-auto px-4 pb-4 sm:pb-8 scroll-mt-24">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2">How our content is made</h2>
          <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
            <p>
              Articles are researched and drafted with the help of AI tools, using published material from sources such as WOAH, FAO, national veterinary services, research institutes and the Merck Veterinary Manual.
            </p>
            <p>
              Automated checks compare each draft with its research before publishing. Our guides avoid drug doses and point readers to a qualified veterinarian for diagnosis and treatment.
            </p>
            <p>
              Found an error? Please{' '}
              <Link href="/contact" className="text-green-700 underline">tell us</Link> and we will correct it. See also our{' '}
              <Link href="/disclaimer" className="text-green-700 underline">disclaimer</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* What we stand for */}
      <section className="max-w-4xl mx-auto px-4 pb-6 sm:pb-10">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-3">What We Stand For</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-green-50 rounded-xl p-3 sm:p-4">
              <div className="text-xl mb-1">{v.icon}</div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">{v.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-snug mt-0.5">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-5">
          <Link href="/contact" className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition">
            Contact Us
          </Link>
        </div>
      </section>

    </div>
  );
}
