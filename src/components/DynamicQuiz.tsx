'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [quizCache, setQuizCache] = useState<Record<string, Question[]>>({});

  // -------------------------
  // 🧠 GENERATE QUIZ
  // -------------------------
  const generateQuiz = async () => {
    setError('');

    if (quizCache[topic]) {
      setQuestions(quizCache[topic]);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResult(false);
      setViewReview(false);
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

      if (!response.ok) throw new Error(data.error || 'Failed to generate quiz');

      const safeQuestions = data.questions || [];

      setQuizCache((prev) => ({
        ...prev,
        [topic]: safeQuestions,
      }));

      setQuestions(safeQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResult(false);
      setViewReview(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 🧠 STORE ANSWER
  // -------------------------
  const handleAnswer = (index: number) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = index;
    setAnswers(updated);
  };

  // -------------------------
  // ➡ NEXT QUESTION
  // -------------------------
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  // -------------------------
  // 🧮 SCORE
  // -------------------------
  const score =
    questions.length > 0
      ? questions.reduce((total, q, i) => {
          return answers[i] === q.correctIndex ? total + 1 : total;
        }, 0)
      : 0;

  const perfectScore =
    questions.length > 0 && score === questions.length;

  // -------------------------
  // 🎓 CERTIFICATE
  // -------------------------
  const downloadCertificate = () => {
    const doc = new jsPDF();

    const name = prompt('Enter your name') || 'Student';
    const pageWidth = doc.internal.pageSize.getWidth();

    // BORDER
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, 270);

    // LOGO
    doc.addImage(
      '/images/articles/1782829501575.png',
      'PNG',
      pageWidth / 2 - 20,
      15,
      40,
      40
    );

    // TITLE
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VETSHPERE CERTIFICATE', pageWidth / 2, 70, {
      align: 'center',
    });

    // SUBTITLE
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Awarded to', pageWidth / 2, 85, {
      align: 'center',
    });

    // NAME
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(name, pageWidth / 2, 105, { align: 'center' });

    // TEXT
    doc.setFontSize(12);
    doc.text(
      'For completing the VetSphere veterinary assessment test',
      pageWidth / 2,
      125,
      { align: 'center' }
    );

    // SCORE
    doc.setFontSize(14);
    doc.text(
      `Score: ${score} / ${questions.length}`,
      pageWidth / 2,
      145,
      { align: 'center' }
    );

    // TOPIC
    doc.text(`Topic: ${topic}`, pageWidth / 2, 160, {
      align: 'center',
    });

    // OWNER
    doc.text('Owner: Mathews Chilongo', pageWidth / 2, 190, {
      align: 'center',
    });

    // DATE
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      205,
      { align: 'center' }
    );

    // FOOTER
    doc.setFontSize(10);
    doc.text(
      'This certificate is for educational motivation only',
      pageWidth / 2,
      250,
      { align: 'center' }
    );

    doc.save(`vetsphere-certificate-${name}.pdf`);
  };

  const currentQuestion = questions[currentQuestionIndex];

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="max-w-3xl mx-auto p-5 min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">

      {/* HEADER */}
      <h2 className="text-3xl font-bold text-center mb-2">
        Assessment of Veterinary Knowledge by VetSphere
      </h2>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        Test your understanding
      </p>

      {/* START */}
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

          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}
        </div>
      )}

      {/* EXAM */}
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
                className={`block w-full p-3 border rounded text-left transition ${
                  answers[currentQuestionIndex] === i
                    ? 'bg-blue-200 dark:bg-blue-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
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

      {/* RESULT */}
      {showResult && (
        <div className="text-center">

          <h2 className="text-3xl font-bold mb-3">
            Exam Completed 🎓
          </h2>

          <p className="text-2xl mb-2">
            Score: {score} / {questions.length}
          </p>

          {perfectScore && (
            <p className="text-green-600 font-semibold mb-3">
              🎉 Excellent Performance!
            </p>
          )}

          {perfectScore && (
            <button
              onClick={downloadCertificate}
              className="bg-purple-600 text-white px-4 py-2 rounded mb-4"
            >
              🎓 Download Certificate
            </button>
          )}

          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => setViewReview(true)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Review Mistakes
            </button>

            <button
              onClick={() => {
                setQuestions([]);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setShowResult(false);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              New Exam
            </button>
          </div>

        </div>
      )}

      {/* REVIEW */}
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
