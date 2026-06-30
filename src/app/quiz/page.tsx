import DynamicQuiz from '@/components/DynamicQuiz';

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-6">
      <div className="max-w-4xl mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            VetSphere Quiz Lab
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Test your veterinary knowledge
          </p>
        </div>

        {/* QUIZ COMPONENT */}
        <DynamicQuiz />

      </div>
    </div>
  );
}
