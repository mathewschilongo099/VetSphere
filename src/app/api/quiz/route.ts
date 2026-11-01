import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai/client';

function getMotivation(score: number, total: number) {
  const percent = (score / total) * 100;

  if (percent === 100) {
    return "🎉 Outstanding! Perfect score. You have mastered this topic completely!";
  }

  if (percent >= 70) {
    return "👏 Great job! You have a strong understanding. A little more revision will make you excellent.";
  }

  if (percent >= 40) {
    return "👍 Good effort! You are improving. Review your mistakes and try again.";
  }

  return "💪 Keep going! Every attempt improves your knowledge. Don't give up — progress takes time.";
}

export async function POST(req: Request) {
  const { topic, score = 0, total = 0 } = await req.json();

  const prompt = `
Create 5 multiple choice veterinary questions about "${topic}".

Return ONLY valid JSON:

[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "string"
  }
]

No markdown. No extra text.
`;

  // Every AI provider is tried in turn; a reply that is not a valid quiz
  // moves on to the next one.
  try {
    const result = await generate({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 1800,
      timeoutMs: 20000,
      deadlineMs: Date.now() + 50000,
      validate: (text) => {
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('no quiz found in the reply');
        const questions = JSON.parse(match[0]);
        const valid =
          Array.isArray(questions) &&
          questions.length >= 3 &&
          questions.every(
            (q) =>
              typeof q?.question === 'string' &&
              Array.isArray(q?.options) &&
              q.options.length === 4 &&
              Number.isInteger(q?.correctIndex) &&
              q.correctIndex >= 0 &&
              q.correctIndex < 4
          );
        if (!valid) throw new Error('quiz is not in the expected format');
      },
    });
    const match = result.text.match(/\[[\s\S]*\]/)!;
    return NextResponse.json({
      questions: JSON.parse(match[0]),
      source: result.provider,
      message: getMotivation(score, total),
    });
  } catch (err) {
    console.log('All AI providers failed, using the built-in quiz.');
  }

  // -----------------------------
  // 🧱 3. FINAL FALLBACK
  // -----------------------------
  const fallbackQuestions = [
    {
      question: `What is a common veterinary concern in ${topic}?`,
      options: [
        'Nutritional imbalance',
        'Infectious disease',
        'Parasitic infection',
        'All of the above',
      ],
      correctIndex: 3,
      explanation: 'Most veterinary conditions involve multiple causes.',
    },
    {
      question: `Why is ${topic} important in animal health?`,
      options: [
        'Improves productivity',
        'Only for exams',
        'No importance',
        'Only theoretical',
      ],
      correctIndex: 0,
      explanation: 'It directly affects animal health and production.',
    },
  ];

  return NextResponse.json({
    questions: fallbackQuestions,
    source: 'local-fallback',
    message: getMotivation(score, total),
  });
}
