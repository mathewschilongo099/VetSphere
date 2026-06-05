export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Trusted Veterinary Knowledge</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              For Better Animal Health and Production
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/articles" className="btn-primary">
                Read Articles
              </a>
              <a href="/resources" className="btn-outline text-white border-white hover:bg-white hover:text-primary">
                Explore Resources
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="section">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Featured Articles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Articles will be added here */}
            <div className="card">
              <div className="h-48 bg-gradient-to-r from-primary to-secondary rounded-lg mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
              <p className="text-gray-600 dark:text-gray-400">Featured articles will appear here</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Explore Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Categories will be added here */}
            <div className="card text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="font-bold">Categories</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section bg-primary text-white">
        <div className="container max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Stay Updated</h2>
          <p className="text-center mb-8 text-lg opacity-90">
            Subscribe to our newsletter for the latest veterinary insights and animal care tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              required
            />
            <button type="submit" className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
