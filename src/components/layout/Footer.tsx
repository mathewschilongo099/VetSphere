export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">VS</div>
            <span className="text-xl font-bold">VetSphere</span>
          </div>
          <p className="text-gray-400 text-sm">Providing exceptional veterinary care for your beloved pets and livestock.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/about" className="hover:text-white">About Us</a></li>
            <li><a href="/services" className="hover:text-white">Services</a></li>
            <li><a href="/articles" className="hover:text-white">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>info@vetsphere.africa</li>
            <li>+260 123 4567</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Follow Us</h4>
          <div className="flex gap-4">Social Icons</div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-12 pt-6 text-center text-sm text-gray-500">
        © 2026 VetSphere. All rights reserved.
      </div>
    </footer>
  );
}
