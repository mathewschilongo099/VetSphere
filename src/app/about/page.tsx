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
  { icon: '🎯', title: 'Our Mission', desc: 'Empowering farmers and pet owners worldwide with accurate veterinary knowledge and practical tools for better animal health outcomes.' },
  { icon: '👁️', title: 'Our Vision', desc: 'A world where every farmer and pet owner has free access to reliable, professional veterinary guidance regardless of their location.' },
  { icon: '🐄', title: 'Livestock Focus', desc: 'Practical advice for cattle, goats, poultry, pigs and more, covering disease prevention, nutrition, and herd management.' },
  { icon: '🐾', title: 'Pet Care', desc: 'Guidance for dogs, cats and small animals to keep your pets healthy, happy and living their best lives.' },
  { icon: '🌍', title: 'Worldwide Reach', desc: 'While rooted in African veterinary challenges, our content is relevant and useful for farmers and pet owners across the globe.' },
  { icon: '💡', title: 'Always Free', desc: 'All our articles and resources are free to read. We believe quality veterinary knowledge should be accessible to everyone.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gray-900 text-white py-10 sm:py-20 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 sm:mb-5 uppercase tracking-widest">
            About Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 sm:mb-4">About VetSphere</h1>
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto">
            Dedicated to providing trusted veterinary knowledge for farmers and pet owners worldwide.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="max-w-4xl mx-auto px-4 py-6 sm:py-16">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 bg-gray-50 rounded-2xl p-5 sm:p-8 border border-gray-100">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-green-500">
            <Image
              src="/images/articles/mathews.jpg"
              alt="Mathews Chilongo, founder of VetSphere"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-green-600 text-xs font-semibold uppercase tracking-widest mb-1">Founder &amp; Author</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Mathews Chilongo</h2>
            <p className="text-green-600 text-sm font-medium mb-3">Veterinary Practitioner &amp; Freelancer</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              I created VetSphere out of a passion for animal health and a desire to make reliable veterinary knowledge accessible to everyone, whether you are a farmer in rural Africa, a pet owner in a city, or anywhere in between. My goal is to provide practical, accurate, and free information that helps you take better care of your animals.
            </p>
          </div>
        </div>
      </section>

      {/* How we work */}
      <section id="editorial" className="max-w-4xl mx-auto px-4 pb-8 sm:pb-16 scroll-mt-24">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 sm:p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">How our content is made</h2>
          <div className="space-y-3 text-gray-700 text-sm sm:text-base leading-relaxed">
            <p>
              VetSphere publishes general educational guides on livestock and pet health. Articles are researched and drafted with the help of AI tools, using published material from sources such as WOAH, FAO, national veterinary services, research institutes and the Merck Veterinary Manual.
            </p>
            <p>
              Automated checks compare each new draft with the research it was written from before it is published. Our guides avoid prescribing drug doses and point readers to a qualified veterinarian for diagnosis and treatment.
            </p>
            <p>
              Mistakes can still happen. If you find an error or outdated information, please{' '}
              <Link href="/contact" className="text-green-700 underline">tell us</Link> and we will review and correct it. See also our{' '}
              <Link href="/disclaimer" className="text-green-700 underline">disclaimer</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-4xl mx-auto px-4 pb-8 sm:pb-16">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">What We Stand For</h2>
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-green-50 rounded-2xl p-5 sm:p-6">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-10 sm:py-16 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Want to get in touch?</h2>
          <p className="text-green-100 mb-6 sm:mb-8">Have a question, a correction or an idea to collaborate? We would love to hear from you.</p>
          <Link href="/contact" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition inline-block">
            Contact Us →
          </Link>
        </div>
      </section>

    </div>
  );
}
