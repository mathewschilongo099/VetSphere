'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface HistoryItem {
  topic: string;
  difficulty: Difficulty;
  score: number;
  total: number;
  date: string;
}

const TOPICS = [
  'Cattle diseases',
  'Poultry health',
  'Goat management',
  'Dog care',
  'Cat care',
  'Livestock nutrition',
  'Vaccination',
  'Parasites',
];
const COUNTS = [5, 10, 15];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const SECONDS_PER_QUESTION = 30;
const HISTORY_KEY = 'vetsphere-quiz-history';

const fieldCls = 'neo-field w-full rounded-2xl px-4 py-3.5 text-sm';
const btn = 'neo-btn rounded-2xl px-5 py-3.5 font-bold';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function motivation(score: number, total: number) {
  const percent = total ? (score / total) * 100 : 0;
  if (percent === 100) return 'Outstanding! Perfect score. You have mastered this topic.';
  if (percent >= 70) return 'Great job! You have a strong understanding. A little more revision will make you excellent.';
  if (percent >= 40) return 'Good effort! Review your mistakes and try again.';
  return 'Keep going! Every attempt improves your knowledge.';
}

export default function DynamicQuiz() {
  const [topic, setTopic] = useState('livestock diseases');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timed, setTimed] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [showResult, setShowResult] = useState(false);
  const [viewReview, setViewReview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Questions already shown per topic, so a new exam gets different ones.
  const seenRef = useRef<Record<string, string[]>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 10));
      }
    } catch {
      // storage unavailable: history is optional
    }
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const selected = answers[currentQuestionIndex];
  const answered = typeof selected === 'number';

  // -------------------------
  // GENERATE QUIZ
  // -------------------------
  const startQuiz = async () => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setError('Enter a topic or pick one below.');
      return;
    }

    setError('');
    setLoading(true);

    const key = cleanTopic.toLowerCase();

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          count,
          difficulty,
          avoid: (seenRef.current[key] || []).slice(-30),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to generate quiz');

      const safeQuestions: Question[] = data.questions || [];
      if (!safeQuestions.length) throw new Error('No questions were returned. Please try again.');

      seenRef.current[key] = [
        ...(seenRef.current[key] || []),
        ...safeQuestions.map((q) => q.question),
      ].slice(-60);

      setQuestions(safeQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTimeLeft(SECONDS_PER_QUESTION);
      setShowResult(false);
      setViewReview(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // ANSWER (-1 = time ran out)
  // -------------------------
  const choose = (index: number) => {
    if (answered) return;
    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentQuestionIndex] = index;
      return updated;
    });
  };

  // Countdown for timed exams
  useEffect(() => {
    if (!timed || !questions.length || showResult || answered) return;
    if (timeLeft <= 0) {
      choose(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, questions.length, showResult, answered, timeLeft, currentQuestionIndex]);

  // -------------------------
  // SCORE
  // -------------------------
  const score =
    questions.length > 0
      ? questions.reduce((total, q, i) => (answers[i] === q.correctIndex ? total + 1 : total), 0)
      : 0;

  const perfectScore = questions.length > 0 && score === questions.length;

  const finishExam = () => {
    setShowResult(true);
    const item: HistoryItem = {
      topic: topic.trim(),
      difficulty,
      score,
      total: questions.length,
      date: new Date().toISOString(),
    };
    const next = [item, ...history].slice(0, 10);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore: history is optional
    }
  };

  const nextQuestion = () => {
    if (!answered) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(SECONDS_PER_QUESTION);
    } else {
      finishExam();
    }
  };

  const resetToStart = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setViewReview(false);
    setError('');
  };

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

    // LOGO (certificate still downloads if the image is missing)
    try {
      doc.addImage('/images/articles/1782829501575.png', 'PNG', pageWidth / 2 - 20, 15, 40, 40);
    } catch {
      // skip logo
    }

    // TITLE
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VETSPHERE CERTIFICATE', pageWidth / 2, 70, { align: 'center' });

    // SUBTITLE
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Awarded to', pageWidth / 2, 85, { align: 'center' });

    // NAME
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(name, pageWidth / 2, 105, { align: 'center' });

    // TEXT
    doc.setFontSize(12);
    doc.text('For completing the VetSphere veterinary assessment test', pageWidth / 2, 125, {
      align: 'center',
    });

    // SCORE
    doc.setFontSize(14);
    doc.text(`Score: ${score} / ${questions.length}`, pageWidth / 2, 145, { align: 'center' });

    // TOPIC
    doc.text(`Topic: ${topic}`, pageWidth / 2, 160, { align: 'center' });

    // DIFFICULTY
    doc.text(`Difficulty: ${capitalize(difficulty)}`, pageWidth / 2, 175, { align: 'center' });

    // OWNER
    doc.text('Owner: Mathews Chilongo', pageWidth / 2, 195, { align: 'center' });

    // DATE
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 210, { align: 'center' });

    // FOOTER
    doc.setFontSize(10);
    doc.text('This certificate is for educational motivation only', pageWidth / 2, 250, {
      align: 'center',
    });

    doc.save(`vetsphere-certificate-${name}.pdf`);
  };

  const progress = questions.length
    ? ((currentQuestionIndex + (answered ? 1 : 0)) / questions.length) * 100
    : 0;

  const wrong = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => answers[i] !== q.correctIndex);

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
        <div className="space-y-6">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={80}
            className={fieldCls}
            placeholder="Enter topic"
            aria-label="Quiz topic"
          />

          <div>
            <p className="neo-muted mb-3 text-sm">Or pick a topic</p>
            <div className="flex flex-wrap gap-3">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  aria-pressed={topic.trim().toLowerCase() === t.toLowerCase()}
                  className="neo-btn neo-text rounded-full px-4 py-2 text-sm"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="neo-muted mb-3 text-sm">Difficulty</p>
            <div className="grid grid-cols-3 gap-4">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  aria-pressed={difficulty === d}
                  className="neo-btn neo-text rounded-2xl px-3 py-3 text-sm"
                >
                  {capitalize(d)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="neo-muted mb-3 text-sm">Number of questions</p>
            <div className="grid grid-cols-3 gap-4">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  aria-pressed={count === c}
                  className="neo-btn neo-text rounded-2xl px-3 py-3 text-sm"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setTimed((v) => !v)}
            aria-pressed={timed}
            className="neo-btn neo-text w-full rounded-2xl px-4 py-3 text-sm"
          >
            Timed exam: {SECONDS_PER_QUESTION} seconds per question ({timed ? 'on' : 'off'})
          </button>

          <button
            onClick={startQuiz}
            disabled={loading || !topic.trim()}
            className={`${btn} neo-accent w-full`}
          >
            {loading ? 'Generating…' : 'Start exam'}
          </button>

          {error && (
            <p role="alert" className="neo-danger text-center text-sm font-medium">
              {error}
            </p>
          )}

          {history.length > 0 && (
            <div className="neo-inset rounded-2xl p-4">
              <p className="mb-2 text-sm font-bold">Recent results</p>
              <ul className="space-y-1 text-sm">
                {history.slice(0, 5).map((h, i) => (
                  <li key={i} className="neo-muted">
                    {h.score}/{h.total} on {h.topic} ({h.difficulty}),{' '}
                    {new Date(h.date).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* EXAM */}
      {questions.length > 0 && !showResult && currentQuestion && (
        <div>
          <div className="neo-muted mb-2 flex items-center justify-between text-sm font-medium">
            <span>
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
            {timed && !answered && (
              <span role="timer" className={timeLeft <= 10 ? 'neo-danger font-bold' : ''}>
                {timeLeft}s
              </span>
            )}
          </div>

          <div
            className="neo-inset mb-6 h-3 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={currentQuestionIndex + (answered ? 1 : 0)}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'var(--neo-accent)' }}
            />
          </div>

          <h3 className="mb-5 text-xl font-bold">{currentQuestion.question}</h3>

          <div className="space-y-4">
            {currentQuestion.options.map((opt, i) => {
              const isCorrect = i === currentQuestion.correctIndex;
              const isChosen = selected === i;
              let cls = 'neo-btn neo-text';
              let tag = '';

              if (answered) {
                if (isCorrect) {
                  cls = 'neo-pressed neo-accent font-bold';
                  tag = 'Correct answer';
                } else if (isChosen) {
                  cls = 'neo-pressed neo-danger font-bold';
                  tag = 'Your answer';
                } else {
                  cls = 'neo-raised neo-muted';
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={answered}
                  className={`${cls} block w-full rounded-2xl p-4 text-left text-sm disabled:cursor-default`}
                >
                  {opt}
                  {tag && <span className="mt-1 block text-xs font-semibold">{tag}</span>}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="neo-inset mt-6 rounded-2xl p-4 text-sm" role="status">
              {selected === -1 && (
                <p className="neo-danger mb-2 font-semibold">Time is up.</p>
              )}
              {currentQuestion.explanation || 'No explanation provided.'}
            </div>
          )}

          <button
            onClick={nextQuestion}
            disabled={!answered}
            className={`${btn} neo-accent mt-7 w-full`}
          >
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

          <p className={`mb-5 text-sm font-semibold ${perfectScore ? 'neo-accent' : 'neo-muted'}`}>
            {motivation(score, questions.length)}
          </p>

          {perfectScore && (
            <button onClick={downloadCertificate} className={`${btn} neo-violet mb-5`}>
              Download certificate
            </button>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {wrong.length > 0 && (
              <button onClick={() => setViewReview(true)} className={`${btn} neo-danger`}>
                Review mistakes
              </button>
            )}

            <button onClick={startQuiz} disabled={loading} className={`${btn} neo-accent`}>
              {loading ? 'Generating…' : 'Same topic, new questions'}
            </button>

            <button onClick={resetToStart} className={`${btn} neo-text`}>
              Change topic
            </button>
          </div>

          {error && (
            <p role="alert" className="neo-danger mt-4 text-sm font-medium">
              {error}
            </p>
          )}
        </div>
      )}

      {/* REVIEW */}
      {showResult && viewReview && (
        <div className="mt-10">
          <h2 className="mb-5 text-2xl font-extrabold">Review mistakes</h2>

          {wrong.map(({ q, i }) => {
            const userAnswer = answers[i];
            return (
              <div key={i} className="neo-raised mb-6 rounded-2xl p-5">
                <p className="font-bold">{q.question}</p>

                <p className="neo-danger mt-2 text-sm">
                  Your answer:{' '}
                  {typeof userAnswer === 'number' && userAnswer >= 0
                    ? q.options[userAnswer]
                    : 'No answer'}
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
