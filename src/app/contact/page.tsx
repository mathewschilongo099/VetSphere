export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-emerald-600 text-white py-16 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Contact Us</h1>
          <p className="text-green-100 text-base sm:text-xl">We'd love to hear from you.</p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-10 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
            <input type="text" placeholder="John Doe" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea placeholder="How can we help?" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm h-36 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-xl font-bold text-base transition">
            Send Message
          </button>
        </div>
      </section>

    </div>
  );
}
