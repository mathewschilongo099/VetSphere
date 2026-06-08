import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ServicesPage() {
  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-center mb-12">Our Services</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow">
              <h3 className="text-2xl font-semibold mb-4">Veterinary Consultation</h3>
              <p>Expert advice for your animals.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow">
              <h3 className="text-2xl font-semibold mb-4">Livestock Training</h3>
              <p>Workshops and resources for farmers.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
