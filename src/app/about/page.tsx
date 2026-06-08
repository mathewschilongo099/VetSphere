export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-emerald-600 text-white py-16 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">About VetSphere</h1>
          <p className="text-green-100 text-base sm:text-xl max-w-2xl mx-auto">
            Dedicated to providing trusted veterinary knowledge for African farmers and pet owners.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          VetSphere is dedicated to providing high-quality veterinary education, livestock management resources, and pet care guidance for farmers and pet owners in Africa and beyond.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h2>
            <p className="text-gray-600 text-sm">Empowering animal caregivers with knowledge and tools for better health outcomes across Africa.</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">👁️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h2>
            <p className="text-gray-600 text-sm">A continent where every farmer and pet owner has access to reliable veterinary guidance.</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🐄</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Livestock Focus</h2>
            <p className="text-gray-600 text-sm">Practical advice tailored for cattle, goats, poultry and more in African conditions.</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">🐾</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pet Care</h2>
            <p className="text-gray-600 text-sm">Trusted guidance for dogs, cats and small animals to keep your pets healthy and happy.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
