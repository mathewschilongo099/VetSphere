export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-emerald-600 text-white py-16 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Our Services</h1>
          <p className="text-green-100 text-base sm:text-xl">Everything you need for better animal health.</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-3">🩺</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Veterinary Consultation</h3>
            <p className="text-gray-500 text-sm">Expert advice for your animals from qualified veterinary professionals.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-3">🌾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Livestock Training</h3>
            <p className="text-gray-500 text-sm">Workshops and resources designed specifically for African farmers.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-3">💊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Disease Prevention</h3>
            <p className="text-gray-500 text-sm">Guides on vaccinations, hygiene and preventing common animal diseases.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Educational Articles</h3>
            <p className="text-gray-500 text-sm">Free, reliable articles written with veterinary accuracy for everyone.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
