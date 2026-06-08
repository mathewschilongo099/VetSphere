import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-center mb-8">About VetSphere</h1>
          <p className="text-xl text-gray-600 mb-8">
            VetSphere is dedicated to providing high-quality veterinary education, livestock management resources, and pet care guidance for farmers and pet owners in Africa and beyond.
          </p>
          <div className="prose max-w-none">
            <h2>Our Mission</h2>
            <p>Empowering animal caregivers with knowledge and tools for better health outcomes.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
