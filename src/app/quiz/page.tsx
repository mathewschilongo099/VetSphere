import DynamicQuiz from '@/components/DynamicQuiz';

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-6">
      <div className="max-w-4xl mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            VetSphere Quiz Lab
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test your veterinary knowledge
          </p>
        </div>

        {/* QUIZ COMPONENT */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6">
          <DynamicQuiz />
        </div>

      </div>
    </div>
  );
}
