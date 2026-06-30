'use client';

import React, { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  articleLink?: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: 'Does your livestock show signs of reduced appetite, fever, or lethargy?',
    options: ['Yes', 'No', 'Not sure'],
    articleLink: '/articles',
  },
  {
    id: 2,
    question: 'Are there cases of diarrhea or bloody stools in your poultry or calves?',
    options: ['Yes', 'No', 'Not sure'],
    articleLink: '/articles',
  },
  {
    id: 3,
    question: 'Have you noticed swelling, lameness, or respiratory issues?',
    options: ['Yes', 'No', 'Not sure'],
    articleLink: '/articles',
  },
  // Add more questions here...
];

export default function SymptomChecker() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: answer }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700 dark:text-green-400">Quiz Results</h2>
        
        <div className="space-y-6 mb-8">
          {Object.entries(answers).map(([qId, answer]) => {
            const q = questions.find(qq => qq.id === parseInt(qId));
            return (
              <div key={qId} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="font-medium mb-1">{q?.question}</p>
                <p className="text-green-600 dark:text-green-400 font-medium">Your answer: {answer}</p>
                {q?.articleLink && (
                  <a href={q.articleLink} className="inline-flex items-center mt-3 text-blue-600 hover:underline">
                    → Read related veterinary guide
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
            ⚠️ This tool is for educational purposes only and is not a substitute for professional veterinary diagnosis.
          </p>
          <button 
            onClick={resetQuiz}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Symptom Checker</h2>
          <p className="text-gray-600 dark:text-gray-400">Livestock & Pet Health Assessment</p>
        </div>
        <div className="text-sm text-gray-500 self-end">
          {currentQuestion + 1} / {questions.length}
        </div>
      </div>

      <div className="mb-10">
        <p className="text-xl leading-relaxed text-gray-800 dark:text-gray-200">{q.question}</p>
      </div>

      <div className="space-y-3">
        {q.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            className="w-full p-5 text-left border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-lg font-medium"
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-8 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300" 
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
