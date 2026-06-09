import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
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

      {/* Founder Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row items-center gap-8 bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-green-500">
            <Image
              src="/images/articles/mathews.jpg"
              alt="Mathews Chilongo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-green-600 text-xs font-semibold uppercase tracking-widest mb-1">Founder & Author</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Mathews Chilongo</h2>
            <p className="text-green-600 text-sm font-medium mb-3">Veterinary Practitioner & Freelancer</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              I created VetSphere out of a passion for animal health and a desire to make reliable veterinary knowledge accessible to everyone — whether you're a farmer in rural Africa, a pet owner in a city, or anywhere in between. My goal is to provide practical, accurate, and free information that helps you take better care of your animals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">What We Stand For</h2>
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Empowering farmers and pet owners worldwide with accurate veterinary knowledge and practical tools for better animal health outcomes.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">👁️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              A world where every farmer and pet owner has free access to reliable, professional veterinary guidance regardless of their location.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🐄</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Livestock Focus</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Practical advice for cattle, goats, poultry, pigs and more — covering disease prevention, nutrition, and herd management.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🐾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pet Care</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Trusted guidance for dogs, cats and small animals to keep your pets healthy, happy and living their best lives.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Worldwide Reach</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              While rooted in African veterinary challenges, our content is relevant and useful for farmers and pet owners across the globe.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Always Free</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              All our articles and resources are completely free. We believe quality veterinary knowledge should be accessible to everyone.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Want to get in touch?</h2>
          <p className="text-green-100 mb-8">Have a question, suggestion or want to collaborate? We'd love to hear from you.</p>
          <a href="/contact" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition inline-block">
            Contact Us →
          </a>
        </div>
      </section>

    </div>
  );
}
