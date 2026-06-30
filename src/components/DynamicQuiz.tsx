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

  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [viewReview, setViewReview] = useState(false);

  const [resultMessage, setResultMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [quizCache, setQuizCache] = useState<Record<string, Question[]>>({});

  const generateQuiz = async () => {
    setError('');

    if (quizCache[topic]) {
      setQuestions(quizCache[topic]);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResult(false);
      setViewReview(false);
      setResultMessage('');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          score: 0,
          total: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setQuizCache((prev) => ({
        ...prev,
        [topic]: data.questions,
      }));

      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResult(false);
      setViewReview(false);
      setResultMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = index;
    setAnswers(updated);
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      const finalScore = questions.reduce((total, q, i) => {
        return answers[i] === q.correctIndex ? total + 1 : total;
      }, 0);

      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            score: finalScore,
            total: questions.length,
          }),
        });

        const data = await res.json();
        setResultMessage(data.message || '');
      } catch {
        setResultMessage('');
      }

      setShowResult(true);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const score = questions.reduce((total, q, i) => {
    return answers[i] === q.correctIndex ? total + 1 : total;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto p-5 min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">

      {/* HEADER */}
      <h2 className="text-3xl font-bold text-center mb-2">
        Assessment of veterinary knowledge by VetSphere
      </h2>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        Test your veterinary knowledge
      </p>

      {/* START SCREEN */}
      {!questions.length && !showResult && (
        <div className="space-y-4">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border rounded text-gray-900"
            placeholder="Enter topic"
          />

          <button
            onClick={generateQuiz}
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            {loading ? 'Generating...' : 'Start Exam'}
          </button>

          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}

      {/* EXAM SCREEN */}
      {questions.length > 0 && !showResult && currentQuestion && (
        <div>
          <div className="mb-3">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>

          <h3 className="text-xl font-semibold mb-4">
            {currentQuestion.question}
          </h3>

          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`block w-full p-3 border rounded text-left ${
                  answers[currentQuestionIndex] === i
                    ? 'bg-blue-200 dark:bg-blue-800'
                    : ''
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={nextQuestion}
            className="mt-5 bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {currentQuestionIndex === questions.length - 1
              ? 'Finish Exam'
              : 'Next Question'}
          </button>
        </div>
      )}

      {/* RESULT SCREEN */}
      {showResult && (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3">
            Exam Completed 🎓
          </h2>

          <p className="text-2xl mb-3">
            Score: {score} / {questions.length}
          </p>

          {resultMessage && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {resultMessage}
            </p>
          )}

          <button
            onClick={() => setViewReview(true)}
            className="bg-red-600 text-white px-4 py-2 rounded mr-2"
          >
            Review Mistakes
          </button>

          <button
            onClick={() => {
              setQuestions([]);
              setCurrentQuestionIndex(0);
              setAnswers([]);
              setShowResult(false);
              setResultMessage('');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            New Exam
          </button>
        </div>
      )}

      {/* REVIEW MODE */}
      {viewReview && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            Review Mistakes
          </h2>

          {questions.map((q, i) => {
            const userAnswer = answers[i];

            if (userAnswer === q.correctIndex) return null;

            return (
              <div key={i} className="mb-5 p-4 border rounded">
                <p className="font-bold">{q.question}</p>

                <p className="text-red-500">
                  Your Answer: {q.options[userAnswer ?? -1]}
                </p>

                <p className="text-green-600">
                  Correct: {q.options[q.correctIndex]}
                </p>

                <p className="mt-2">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
