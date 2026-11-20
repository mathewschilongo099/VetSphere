'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const fieldCls = 'neo-field w-full rounded-2xl px-4 py-3.5 text-sm';
const btn = 'neo-btn rounded-2xl px-5 py-3.5 font-bold';

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
    <div className="neo-text mx-auto max-w-2xl">
      {/* HEADER */}
      <h2 className="mb-2 text-center text-2xl font-extrabold sm:text-3xl">
        Assessment of Veterinary Knowledge by VetSphere
      </h2>

      <p className="neo-muted mb-8 text-center text-sm">Test your understanding</p>

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

          <button onClick={generateQuiz} disabled={loading} className={`${btn} neo-accent w-full`}>
            {loading ? 'Generating…' : 'Start exam'}
          </button>

          {error && (
            <p role="alert" className="neo-danger text-center text-sm font-medium">
              {error}
            </p>
          )}
        </div>
      )}

      {/* EXAM */}
      {questions.length > 0 && !showResult && currentQuestion && (
        <div>
          <div className="neo-muted mb-3 text-sm font-medium">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>

          <h3 className="mb-5 text-xl font-bold">{currentQuestion.question}</h3>

          <div className="space-y-4">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                aria-pressed={answers[currentQuestionIndex] === i}
                className="neo-btn neo-text block w-full rounded-2xl p-4 text-left text-sm"
              >
                {opt}
              </button>
            ))}
          </div>

          <button onClick={nextQuestion} className={`${btn} neo-accent mt-7 w-full`}>
            {currentQuestionIndex === questions.length - 1 ? 'Finish exam' : 'Next question'}
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
            <p className="neo-accent mb-4 font-semibold">Excellent performance!</p>
          )}

          {perfectScore && (
            <button onClick={downloadCertificate} className={`${btn} neo-violet mb-5`}>
              Download certificate
            </button>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setViewReview(true)} className={`${btn} neo-danger`}>
              Review mistakes
            </button>

            <button
              onClick={() => {
                setQuestions([]);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setShowResult(false);
              }}
              className={`${btn} neo-accent`}
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
              <div key={i} className="neo-raised mb-6 rounded-2xl p-5">
                <p className="font-bold">{q.question}</p>

                <p className="neo-danger mt-2 text-sm">
                  Your answer: {q.options[userAnswer ?? -1]}
                </p>

                <p className="neo-accent text-sm">Correct: {q.options[q.correctIndex]}</p>

                <p className="mt-2 text-sm">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
