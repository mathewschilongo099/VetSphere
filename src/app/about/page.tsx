import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About VetSphere | Who We Are and How We Write',
  description:
    'Meet the founder of VetSphere and read our editorial policy, sources and advertising disclosure.',
  alternates: { canonical: '/about' },
};

const pillars = [
  { icon: '🎯', title: 'Our Mission', text: 'Empowering farmers and pet owners worldwide with accurate veterinary knowledge and practical tools for better animal health outcomes.' },
  { icon: '👁️', title: 'Our Vision', text: 'A world where every farmer and pet owner has free access to reliable, professional veterinary guidance regardless of their location.' },
  { icon: '🐄', title: 'Livestock Focus', text: 'Practical advice for cattle, goats, poultry, pigs and more — covering disease prevention, nutrition, and herd management.' },
  { icon: '🐾', title: 'Pet Care', text: 'Trusted guidance for dogs, cats and small animals to keep your pets healthy, happy and living their best lives.' },
  { icon: '🌍', title: 'Worldwide Reach', text: 'While rooted in African veterinary challenges, our content is relevant and useful for farmers and pet owners across the globe.' },
  { icon: '💡', title: 'Always Free', text: 'All our articles and resources are completely free. We believe quality veterinary knowledge should be accessible to everyone.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <section className="bg-gray-900 text-white py-20 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-600/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            About Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">About VetSphere</h1>
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto">
            Dedicated to providing trusted veterinary knowledge for farmers and pet owners worldwide.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row items-center gap-8 bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-green-500">
            <Image src="/images/articles/mathews.jpg" alt="Mathews Chilongo" fill className="object-cover" />
          </div>
          <div>
            <p className="text-green-600 text-xs font-semibold uppercase tracking-widest mb-1">Founder & Author</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Mathews Chilongo</h2>
            <p className="text-green-600 text-sm font-medium mb-3">Veterinary Student · Lusaka, Zambia</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              I created VetSphere out of a passion for animal health and a desire to make reliable veterinary knowledge accessible to everyone — whether you&apos;re a farmer in rural Africa, a pet owner in a city, or anywhere in between. I am studying veterinary medicine in Zambia, with coursework in poultry disease, large animal disease and animal science. My goal is to provide practical, accurate, and free information that helps you take better care of your animals.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">What We Stand For</h2>
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="bg-green-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{p.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Editorial Policy</h2>
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>
        <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-green-600">
          <p>
            Articles are written for education. We use AI tools to help research and draft, and every article is reviewed and edited by the author before it is published. Each article ends with a list of general reference sources such as WOAH, FAO and the Merck Veterinary Manual.
          </p>
          <ul>
            <li>We do not give drug doses or treatment protocols as a substitute for a veterinarian&apos;s advice.</li>
            <li>Notifiable and emergency conditions always tell readers to contact a veterinarian or the authorities.</li>
            <li>Found a mistake? Tell us through the <Link href="/contact">contact page</Link> and we will review and correct it.</li>
          </ul>
          <h3>Advertising and affiliate disclosure</h3>
          <p>
            VetSphere is supported by advertising (Google AdSense) and may include affiliate links. Advertising never decides what we write. See the <Link href="/privacy-policy">Privacy Policy</Link>, <Link href="/terms">Terms of Use</Link> and <Link href="/disclaimer">Veterinary Disclaimer</Link>.
          </p>
        </div>
      </section>

      <section className="bg-green-600 py-16 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Want to get in touch?</h2>
          <p className="text-green-100 mb-8">Have a question, correction or want to collaborate? We&apos;d love to hear from you.</p>
          <Link href="/contact" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition inline-block">
            Contact Us →
          </Link>
        </div>
      </section>
    </div>
  );
}
