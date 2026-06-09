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
            Practical veterinary resources and knowledge for farmers and pet owners worldwide — all free.
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
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">🩺</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Veterinary Guidance</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Access detailed veterinary guidance written by professionals. From diagnosing symptoms to treatment options — we cover it all in easy to understand language.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">🌾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Livestock Management</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Comprehensive resources for cattle, goat, poultry and pig farmers. Learn best practices for feeding, breeding, housing and herd management.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">💊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Disease Prevention</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Stay ahead of animal diseases with our prevention guides. Learn about vaccinations, biosecurity measures and early warning signs to protect your animals.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">🐾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pet Care Resources</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Everything you need to keep your dogs, cats and small animals healthy. From nutrition to common illnesses — reliable guidance for pet owners worldwide.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free Educational Articles</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              A growing library of free veterinary articles covering livestock, pets, nutrition, disease prevention and more — written for farmers and pet owners of all experience levels.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Product Recommendations</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Trusted recommendations for veterinary products, supplements, equipment and tools to help you provide the best care for your animals.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16 w-full">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to learn more?</h2>
          <p className="text-green-100 mb-8">Browse our free articles or get in touch with any questions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/articles" className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition text-center">
              Browse Articles
            </a>
            <a href="/contact" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-center">
              Contact Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
