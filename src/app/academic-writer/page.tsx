// src/app/academic-writer/page.tsx
import AcademicWriterForm from '@/components/academic/AcademicWriterForm';

export const metadata = {
  title: 'Academic Writer - Generate Research & Essays | VetSphere',
  description: 'Generate professional academic essays, research papers, and reports for diploma, bachelor, masters, or PhD level instantly.'
};

export default function AcademicWriterPage() {
  return (
    <div className="neo-page min-h-screen px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="neo-raised neo-accent mb-5 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            AI-powered academic writing
          </div>
          <h1 className="neo-text mb-4 text-4xl font-extrabold md:text-5xl">Academic Writer</h1>
          <p className="neo-muted mx-auto max-w-2xl text-lg">
            Get a professionally structured essay or research paper at your academic level,
            from Diploma to PhD.
          </p>
        </div>

        {/* Form */}
        <div className="neo-scope neo-card neo-text p-6 md:p-9">
          <AcademicWriterForm />
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
            <div key={f.title} className="neo-raised rounded-2xl p-5">
              <div className="mb-2 text-3xl">{f.icon}</div>
              <div className="neo-text font-bold">{f.title}</div>
              <div className="neo-muted mt-1 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="neo-inset neo-warn mt-8 rounded-2xl p-5 text-sm">
          <strong>Academic integrity:</strong> Use this tool as a research aid and reference.
          Always verify citations, adapt content to your specific requirements, and follow your
          institution’s academic integrity policies.
        </div>
      </div>
    </div>
  );
}
