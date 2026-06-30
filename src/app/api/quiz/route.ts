import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

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

  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

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

  // -----------------------------
  // 🧠 1. GROQ (PRIMARY)
  // -----------------------------
  try {
    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey });

      const completion = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content || '';
      const match = text.match(/\[[\s\S]*\]/);

      if (match) {
        return NextResponse.json({
          questions: JSON.parse(match[0]),
          source: 'groq',
          message: getMotivation(score, total),
        });
      }
    }
  } catch (err) {
    console.log('Groq failed, switching to OpenRouter...');
  }

  // -----------------------------
  // 🌐 2. OPENROUTER (FALLBACK)
  // -----------------------------
  try {
    if (openRouterKey) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const match = text.match(/\[[\s\S]*\]/);

      if (match) {
        return NextResponse.json({
          questions: JSON.parse(match[0]),
          source: 'openrouter',
          message: getMotivation(score, total),
        });
      }
    }
  } catch (err) {
    console.log('OpenRouter failed, using fallback quiz...');
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
