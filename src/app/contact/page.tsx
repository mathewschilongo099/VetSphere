import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-center mb-8">Contact Us</h1>
          <form className="space-y-6 bg-white p-8 rounded-2xl shadow">
            <div>
              <label className="block mb-2">Name</label>
              <input type="text" className="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
              <label className="block mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
              <label className="block mb-2">Message</label>
              <textarea className="w-full px-4 py-3 border rounded-lg h-32" />
            </div>
            <button type="submit" className="w-full bg-blue-900 text-white py-4 rounded-lg font-semibold">Send Message</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
