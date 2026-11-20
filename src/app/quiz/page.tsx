import DynamicQuiz from '@/components/DynamicQuiz';

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-[#e6e9ef] px-4 py-12 text-[#2b3040]">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#2b3040] sm:text-5xl">
            VetSphere Quiz Lab
          </h1>
          <p className="text-lg text-[#6b7280]">Test your veterinary knowledge</p>
        </div>

        {/* QUIZ COMPONENT */}
        <div className="rounded-[28px] bg-[#e6e9ef] p-5 shadow-[14px_14px_30px_#c5cad6,-14px_-14px_30px_#ffffff] sm:p-8">
          <DynamicQuiz />
        </div>
      </div>
    </div>
  );
}
