import DynamicQuiz from '@/components/DynamicQuiz';

export default function QuizPage() {
  return (
    <div className="neo-page min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="neo-text mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            VetSphere Quiz Lab
          </h1>
          <p className="neo-muted text-lg">Test your veterinary knowledge</p>
        </div>

        {/* QUIZ COMPONENT */}
        <div className="neo-card p-5 sm:p-8">
          <DynamicQuiz />
        </div>
      </div>
    </div>
  );
}
