'use client';

import React, { useState, useEffect } from 'react';

declare global {
  var GEMINI_API_KEY: string;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

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
  const [quizCompleted, setQuizCompleted] = useState(false);

  const generateQuiz = async () => {
    if (!GEMINI_API_KEY) {
      setError('Gemini API key not configured.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const prompt = `Create a 5-question multiple choice veterinary quiz for students about ${topic}. 
      Format as JSON array of objects with: question, options (array of 4 strings), correctIndex (0-3), explanation.
      Make it educational and accurate for veterinary students or farmers.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON
      const jsonMatch = text.match(/\[.*\]/s);
      const parsedQuestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      
      setQuestions(parsedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuizCompleted(false);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    const currentQ = questions[currentQuestionIndex];
    if (index === currentQ.correctIndex) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold mb-2">VetSphere Quiz Lab</h2>
        <p className="text-gray-600 dark:text-gray-400">AI-Powered Veterinary Learning for Students</p>
      </div>

      {!questions.length ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Choose Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. cattle nutrition, poultry diseases, pet care"
            />
          </div>
          <button
            onClick={generateQuiz}
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl text-lg transition"
          >
            {loading ? 'Generating Quiz...' : 'Generate New Quiz'}
          </button>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>
      ) : quizCompleted ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-3xl font-bold mb-2">Quiz Complete!</h3>
          <p className="text-5xl font-bold text-green-600 mb-6">{score} / {questions.length}</p>
          <button onClick={restartQuiz} className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700">
            Try Another Quiz
          </button>
        </div>
      ) : currentQuestion ? (
        <div>
          <div className="flex justify-between mb-6">
            <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm font-medium">Score: {score}</span>
          </div>

          <h3 className="text-2xl font-semibold mb-8 leading-tight">{currentQuestion.question}</h3>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showExplanation && handleAnswer(index)}
                disabled={showExplanation}
                className={`p-5 text-left rounded-2xl border-2 transition-all text-lg font-medium ${
                  showExplanation 
                    ? index === currentQuestion.correctIndex 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                      : selectedAnswer === index 
                        ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                        : 'border-gray-200'
                    : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950 rounded-2xl border border-amber-200">
              <p className="font-semibold mb-2">Explanation:</p>
              <p>{currentQuestion.explanation}</p>
              <button 
                onClick={nextQuestion}
                className="mt-6 w-full py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700"
              >
                {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
