'use client';

import React, { useState } from 'react';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function DynamicQuiz() {
  const [topic, setTopic] = useState('livestock diseases');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ NEW: cache stored per topic
  const [quizCache, setQuizCache] = useState<Record<string, Question[]>>({});

  const generateQuiz = async () => {
    setError('');

    // 🔥 STEP 1: CHECK CACHE FIRST
    if (quizCache[topic]) {
      setQuestions(quizCache[topic]);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      // 🔥 STEP 2: SAVE TO CACHE
      setQuizCache((prev) => ({
        ...prev,
        [topic]: data.questions,
      }));

      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    const currentQ = questions[currentQuestionIndex];

    if (index === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }

    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const restartQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">
        VetSphere Quiz Lab
      </h2>

      {!questions.length ? (
        <div className="space-y-4">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border rounded"
            placeholder="Enter topic"
          />

          <button
            onClick={generateQuiz}
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            {loading
              ? 'Generating...'
              : quizCache[topic]
              ? 'Load Cached Quiz'
              : 'Generate Quiz'}
          </button>

          {error && <p className="text-red-500">{error}</p>}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>

          <h3 className="text-xl font-semibold mb-4">
            {currentQuestion.question}
          </h3>

          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !showExplanation && handleAnswer(i)}
                className="block w-full p-3 border rounded"
              >
                {opt}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="mt-4">
              <p className="font-bold">Explanation:</p>
              <p>{currentQuestion.explanation}</p>

              <button
                onClick={nextQuestion}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Next
              </button>
            </div>
          )}

          <div className="mt-6">
            Score: {score}
          </div>
        </div>
      )}
    </div>
  );
}
