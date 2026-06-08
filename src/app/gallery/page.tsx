import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function GalleryPage() {
  const images = [
    '/images/cattle.jpg', // add your images to public/images
    '/images/poultry.jpg',
    // more...
  ];
  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-center mb-12">Photo Gallery</h1>
          <div className="grid md:grid-cols-3 gap-6">
            {images.map((src, i) => (
              <img key={i} src={src} alt="Animal" className="rounded-xl shadow" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
