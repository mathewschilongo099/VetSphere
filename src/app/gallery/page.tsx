export default function GalleryPage() {
  const images = [
    '/images/cattle.jpg',
    '/images/poultry.jpg',
  ];
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-emerald-600 text-white py-16 w-full">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Photo Gallery</h1>
          <p className="text-green-100 text-base sm:text-xl">A look at the animals we care for.</p>
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((src, i) => (
              <img key={i} src={src} alt="Animal" className="rounded-2xl shadow-sm w-full object-cover h-56" />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-20 text-lg">Gallery coming soon!</p>
        )}
      </section>

    </div>
  );
}
