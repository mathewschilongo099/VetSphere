// src/app/academic-writer/page.tsx
import AcademicWriterForm from '@/components/academic/AcademicWriterForm';

export const metadata = {
  title: 'Academic Writer - Generate Research & Essays | VetSphere',
  description: 'Generate professional academic essays, research papers, and reports for diploma, bachelor, masters, or PhD level instantly.'
};

const raised = 'shadow-[6px_6px_12px_#c5cad6,-6px_-6px_12px_#ffffff]';

export default function AcademicWriterPage() {
  return (
    <div className="min-h-screen bg-[#e6e9ef] px-4 py-16 text-[#2b3040]">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className={`mb-5 inline-block rounded-full bg-[#e6e9ef] px-4 py-1.5 text-sm font-semibold text-green-700 ${raised}`}>
            AI-powered academic writing
          </div>
          <h1 className="mb-4 text-4xl font-extrabold text-[#2b3040] md:text-5xl">
            Academic Writer
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#6b7280]">
            Get a professionally structured essay or research paper at your academic level,
            from Diploma to PhD.
          </p>
        </div>

        {/* Form */}
        <div className="neo-scope rounded-[28px] bg-[#e6e9ef] p-6 text-[#2b3040] shadow-[14px_14px_30px_#c5cad6,-14px_-14px_30px_#ffffff] md:p-9">
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
            <div key={f.title} className={`rounded-2xl bg-[#e6e9ef] p-5 ${raised}`}>
              <div className="mb-2 text-3xl">{f.icon}</div>
              <div className="font-bold text-[#2b3040]">{f.title}</div>
              <div className="mt-1 text-sm text-[#6b7280]">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl bg-[#e6e9ef] p-5 text-sm text-amber-900 shadow-[inset_5px_5px_10px_#c5cad6,inset_-5px_-5px_10px_#ffffff]">
          <strong>Academic integrity:</strong> Use this tool as a research aid and reference.
          Always verify citations, adapt content to your specific requirements, and follow your
          institution’s academic integrity policies.
        </div>
      </div>
    </div>
  );
}
