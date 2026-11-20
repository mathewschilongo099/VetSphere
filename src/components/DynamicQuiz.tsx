'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Explicit colors everywhere so text stays readable in dark mode.
const raised = 'shadow-[6px_6px_12px_#c5cad6,-6px_-6px_12px_#ffffff]';
const pressed = 'shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff]';
const fieldCls =
  'w-full rounded-2xl bg-[#e6e9ef] px-4 py-3.5 text-sm text-[#2b3040] caret-[#2b3040] ' +
  'placeholder:text-[#8a91a3] outline-none [color-scheme:light] ' +
  'shadow-[inset_5px_5px_10px_#c5cad6,inset_-5px_-5px_10px_#ffffff] ' +
  'focus-visible:ring-2 focus-visible:ring-green-600';
const btn =
  'rounded-2xl bg-[#e6e9ef] px-5 py-3.5 font-bold transition-shadow ' +
  `${raised} hover:shadow-[8px_8px_16px_#c5cad6,-8px_-8px_16px_#ffffff] ` +
  'active:shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 ' +
  'disabled:opacity-60';

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
  // GENERATE QUIZ
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
  // STORE ANSWER
  // -------------------------
  const handleAnswer = (index: number) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = index;
    setAnswers(updated);
  };

  // -------------------------
  // NEXT QUESTION
  // -------------------------
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  // -------------------------
  // SCORE
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
  // CERTIFICATE
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
    <div className="mx-auto max-w-2xl text-[#2b3040]">
      {/* HEADER */}
      <h2 className="mb-2 text-center text-2xl font-extrabold sm:text-3xl">
        Assessment of Veterinary Knowledge by VetSphere
      </h2>

      <p className="mb-8 text-center text-sm text-[#6b7280]">Test your understanding</p>

      {/* START */}
      {!questions.length && !showResult && (
        <div className="space-y-5">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={fieldCls}
            placeholder="Enter topic"
            aria-label="Quiz topic"
          />

          <button
            onClick={generateQuiz}
            disabled={loading}
            className={`${btn} w-full text-green-700`}
          >
            {loading ? 'Generating…' : 'Start exam'}
          </button>

          {error && (
            <p role="alert" className="text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
      )}

      {/* EXAM */}
      {questions.length > 0 && !showResult && currentQuestion && (
        <div>
          <div className="mb-3 text-sm font-medium text-[#6b7280]">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>

          <h3 className="mb-5 text-xl font-bold">{currentQuestion.question}</h3>

          <div className="space-y-4">
            {currentQuestion.options.map((opt, i) => {
              const selected = answers[currentQuestionIndex] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  aria-pressed={selected}
                  className={`block w-full rounded-2xl bg-[#e6e9ef] p-4 text-left text-sm transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 ${
                    selected
                      ? `${pressed} font-bold text-green-700`
                      : `${raised} text-[#2b3040] hover:shadow-[8px_8px_16px_#c5cad6,-8px_-8px_16px_#ffffff]`
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <button
            onClick={nextQuestion}
            className={`${btn} mt-7 w-full text-green-700`}
          >
            {currentQuestionIndex === questions.length - 1
              ? 'Finish exam'
              : 'Next question'}
          </button>
        </div>
      )}

      {/* RESULT */}
      {showResult && (
        <div className="text-center">
          <h2 className="mb-3 text-3xl font-extrabold">Exam completed</h2>

          <p className="mb-2 text-2xl font-bold">
            Score: {score} / {questions.length}
          </p>

          {perfectScore && (
            <p className="mb-4 font-semibold text-green-700">
              Excellent performance!
            </p>
          )}

          {perfectScore && (
            <button
              onClick={downloadCertificate}
              className={`${btn} mb-5 text-purple-700`}
            >
              Download certificate
            </button>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setViewReview(true)}
              className={`${btn} text-red-600`}
            >
              Review mistakes
            </button>

            <button
              onClick={() => {
                setQuestions([]);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setShowResult(false);
              }}
              className={`${btn} text-green-700`}
            >
              New exam
            </button>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {viewReview && (
        <div className="mt-10">
          <h2 className="mb-5 text-2xl font-extrabold">Review mistakes</h2>

          {questions.map((q, i) => {
            const userAnswer = answers[i];

            if (userAnswer === q.correctIndex) return null;

            return (
              <div
                key={i}
                className={`mb-6 rounded-2xl bg-[#e6e9ef] p-5 ${raised}`}
              >
                <p className="font-bold">{q.question}</p>

                <p className="mt-2 text-sm text-red-600">
                  Your answer: {q.options[userAnswer ?? -1]}
                </p>

                <p className="text-sm text-green-700">
                  Correct: {q.options[q.correctIndex]}
                </p>

                <p className="mt-2 text-sm text-[#2b3040]">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
