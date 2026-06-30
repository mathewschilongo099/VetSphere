import SymptomChecker from '@/components/SymptomChecker';

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            🐄🐾 New Tool
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">Animal Health Symptom Checker</h1>
          <p className="max-w-md mx-auto text-xl text-gray-600 dark:text-gray-400">
            Answer a few quick questions about symptoms in your livestock or pets and get tailored guidance.
          </p>
        </div>
        
        <SymptomChecker />

        <div className="mt-16 text-center text-sm text-gray-500 max-w-md mx-auto">
          This is an educational tool based on common veterinary knowledge. Always consult a qualified veterinarian for diagnosis and treatment.
        </div>
      </div>
    </div>
  );
}
