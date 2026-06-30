{/* MOBILE MENU */}
{menuOpen && (
  <div className="md:hidden bg-white border-t shadow-lg">
    <div className="px-4 py-3 flex flex-col gap-2 text-gray-800">

      <a href="/" onClick={() => setMenuOpen(false)} className="py-2 border-b">
        🏠 Home
      </a>

      <a href="/articles" onClick={() => setMenuOpen(false)} className="py-2 border-b">
        📚 Articles
      </a>

      <a href="/services" onClick={() => setMenuOpen(false)} className="py-2 border-b">
        🧰 Services
      </a>

      <a href="/about" onClick={() => setMenuOpen(false)} className="py-2 border-b">
        ℹ️ About
      </a>

      {/* FIXED ASK VETASSIST */}
      <a
        href="/ask"
        onClick={() => setMenuOpen(false)}
        className="py-3 px-3 rounded-lg bg-green-50 text-green-700 font-semibold flex items-center gap-2"
      >
        🤖 Ask VetAssist
      </a>

      {/* FIXED QUIZ BUTTON */}
      <a
        href="/quiz"
        onClick={() => setMenuOpen(false)}
        className="py-3 px-3 rounded-lg bg-blue-50 text-blue-700 font-semibold flex items-center gap-2"
      >
        🧠 Take Quiz
      </a>

      <a
        href="/contact"
        className="bg-green-600 text-white text-center py-3 rounded-lg mt-2 font-semibold"
        onClick={() => setMenuOpen(false)}
      >
        Contact Us
      </a>

    </div>
  </div>
)}
