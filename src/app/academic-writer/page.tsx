// src/app/academic-writer/page.tsx
import AcademicWriterForm from '@/components/academic/AcademicWriterForm';

export const metadata = {
  title: 'Academic Writer - Generate Research & Essays | VetSphere',
  description: 'Generate professional academic essays, research papers, and reports for diploma, bachelor, masters, or PhD level instantly.'
};

export default function AcademicWriterPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            ✨ AI-Powered Academic Writing
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Academic Writer
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get a professionally structured essay or research paper at your academic level — 
            from Diploma to PhD
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border shadow-sm">
          <AcademicWriterForm />
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { 
              icon: '📚', 
              title: 'Multiple Levels', 
              desc: "Diploma, Bachelor's, Master's, or PhD level content" 
            },
            { 
              icon: '🔍', 
              title: 'Well-Researched', 
              desc: 'Includes citations, references, and academic sources' 
            },
            { 
              icon: '✍️', 
              title: 'Professional Structure', 
              desc: 'Abstract, introduction, body, conclusion, and references' 
            }
          ].map((f) => (
            <div key={f.title} className="p-5 border rounded-xl bg-white hover:shadow-md transition">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-bold text-gray-900">{f.title}</div>
              <div className="text-sm text-gray-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <strong>⚠️ Academic Integrity:</strong> Use this tool as a research aid and reference. 
          Always verify citations, adapt content to your specific requirements, and follow your 
          institution&apos;s academic integrity policies.
        </div>
      </div>
    </div>
  );
}
