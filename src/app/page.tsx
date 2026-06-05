export default function HomePage() {
const categories = [
"Animal Health",
"Poultry Farming",
"Dairy Farming",
"Goat Farming",
"Pig Farming",
"Pet Care",
];

const articles = [
{
title: "Common Diseases in Cattle and Their Prevention",
excerpt: "Learn the most common cattle diseases and practical prevention methods.",
},
{
title: "Poultry Vaccination Schedule",
excerpt: "A complete guide to protecting your poultry flock.",
},
{
title: "Improving Dairy Production",
excerpt: "Simple management practices to increase milk yield.",
},
{
title: "Goat Farming for Beginners",
excerpt: "Everything you need to start a profitable goat farm.",
},
{
title: "Pig Nutrition Basics",
excerpt: "Understanding feed requirements for healthy pigs.",
},
{
title: "Pet Vaccination Guide",
excerpt: "Essential vaccinations every pet owner should know.",
},
];

return (
<main className="min-h-screen bg-gray-50">
{/* Navigation */}
<nav className="bg-blue-900 text-white">
<div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
<h1 className="text-2xl font-bold">VetSphere Africa</h1>

      <div className="flex gap-6">
        <a href="#">Home</a>
        <a href="#">Blog</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>
    </div>
  </nav>

  {/* Hero */}
  <section className="bg-gradient-to-r from-blue-900 to-green-700 text-white py-20">
    <div className="max-w-6xl mx-auto px-6 text-center">
      <h2 className="text-5xl font-bold mb-6">
        Trusted Veterinary Knowledge for Better Animal Health and Production
      </h2>

      <p className="text-xl mb-8">
        Veterinary education, livestock management, pet care, and animal
        health resources for Africa and beyond.
      </p>

      <div className="flex justify-center gap-4">
        <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold">
          Read Articles
        </button>

        <button className="bg-green-600 px-6 py-3 rounded-lg font-semibold">
          Join Newsletter
        </button>
      </div>
    </div>
  </section>

  {/* Categories */}
  <section className="max-w-6xl mx-auto px-6 py-16">
    <h3 className="text-3xl font-bold mb-8">Popular Categories</h3>

    <div className="grid md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div
          key={category}
          className="bg-white p-6 rounded-xl shadow"
        >
          <h4 className="font-semibold">{category}</h4>
        </div>
      ))}
    </div>
  </section>

  {/* Articles */}
  <section className="max-w-6xl mx-auto px-6 py-16">
    <h3 className="text-3xl font-bold mb-8">Featured Articles</h3>

    <div className="grid md:grid-cols-3 gap-6">
      {articles.map((article) => (
        <div
          key={article.title}
          className="bg-white rounded-xl shadow overflow-hidden"
        >
          <div className="h-40 bg-gray-300"></div>

          <div className="p-5">
            <h4 className="font-bold mb-2">{article.title}</h4>

            <p className="text-gray-600 mb-4">
              {article.excerpt}
            </p>

            <button className="bg-blue-900 text-white px-4 py-2 rounded">
              Read More
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>

  {/* Newsletter */}
  <section className="bg-green-700 text-white py-16">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h3 className="text-3xl font-bold mb-4">
        Subscribe to Our Newsletter
      </h3>

      <p className="mb-6">
        Get veterinary tips, farming advice, and animal health updates.
      </p>

      <input
        type="email"
        placeholder="Enter your email"
        className="w-full md:w-96 px-4 py-3 rounded text-black"
      />
    </div>
  </section>

  {/* Footer */}
  <footer className="bg-blue-950 text-white py-8 text-center">
    <p>© 2026 VetSphere Africa. All Rights Reserved.</p>
  </footer>
</main>

);
}
