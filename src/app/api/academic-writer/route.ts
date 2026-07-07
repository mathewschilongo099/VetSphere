// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const GEMINI_MODEL = 'gemini-2.5-flash';

const typeLabels: Record<string, string> = {
  essay: 'Assignment',
  research: 'Research Paper',
  report: 'Report',
  'case-study': 'Case Study',
};

const levelMap: Record<string, { label: string; pageCount: string; depth: string }> = {
  diploma: {
    label: 'Diploma Level',
    pageCount: '20-30 pages',
    depth: 'clear, practical, and moderately detailed',
  },
  degree: {
    label: "Bachelor's Degree Level",
    pageCount: '30-45 pages',
    depth: 'detailed, well-referenced, and analytically sound',
  },
  masters: {
    label: "Master's Degree Level",
    pageCount: '40-60 pages',
    depth: 'rigorous, critically analytical, and thoroughly evidenced',
  },
  phd: {
    label: 'PhD Level',
    pageCount: '50-80 pages',
    depth: 'highly rigorous, original, critically evaluative, and exhaustively evidenced',
  },
};

interface ChapterSpec {
  id: string;
  title: string;
  chapterLabel: string;
  instructions: string;
}

function buildChapterSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      instructions: `Write ONLY the following front-matter sections, in this order, fully written out:

DECLARATION
DEDICATION
ACKNOWLEDGEMENTS
ABSTRACT (with keywords)
LIST OF ABBREVIATIONS AND ACRONYMS

Do NOT write a Table of Contents section. Do not guess page numbers.

The title and framing you establish here are FINAL. Every later chapter must stay consistent.

CRITICAL: Use plain text only. No markdown, no asterisks for bold. Write headings in ALL CAPS as shown above.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      instructions: `Write the FULL Chapter One content.

CRITICAL: Start with the chapter label "CHAPTER ONE" on its own line, then the chapter title "1.0 INTRODUCTION" on the next line.

Then continue with these subsections in order:
1.1 Background of the Study
1.2 Statement of the Problem
1.3 Research Objectives (with 1.3.1 General Objective and 1.3.2 Specific Objectives)
1.4 Research Questions
1.5 Significance of the Study
1.6 Scope of Study
1.7 Operational Definitions

CRITICAL RULES:
- Each subsection heading should be on its own line
- Write substantial paragraphs under each heading
- Use APA 7th style in-text citations
- Never use numbered bracket citations like [1]
- Use plain text only, no markdown, no asterisks

IMPORTANT FORMAT:
CHAPTER ONE
1.0 INTRODUCTION
[content]
1.1 Background of the Study
[content]`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      instructions: `Write the FULL Chapter Two content.

CRITICAL: Start with the chapter label "CHAPTER TWO" on its own line, then the chapter title "2.0 LITERATURE REVIEW" on the next line.

Then continue with these subsections in order:
2.1 Empirical Review
2.1.1 Theme from Objective 1
2.1.2 Theme from Objective 2
2.1.3 Theme from Objective 3
2.2 Theoretical Framework
2.3 Conceptual Framework

CRITICAL RULES:
- Each subsection heading should be on its own line
- Write substantial paragraphs under each heading
- Use APA 7th style in-text citations
- Use plain text only, no markdown

IMPORTANT FORMAT:
CHAPTER TWO
2.0 LITERATURE REVIEW
[content]
2.1 Empirical Review
[content]`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      instructions: `Write the FULL Chapter Three content.

CRITICAL: Start with the chapter label "CHAPTER THREE" on its own line, then the chapter title "3.0 RESEARCH METHODOLOGY" on the next line.

Then continue with these subsections in order:
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sample Size
3.6 Data Collection Instruments and Procedures
3.7 Data Analysis Plan
3.8 Reliability and Validity
3.9 Ethical Considerations

CRITICAL RULES:
- Each subsection heading should be on its own line
- Cite Creswell for research design
- Use plain text only, no markdown

IMPORTANT FORMAT:
CHAPTER THREE
3.0 RESEARCH METHODOLOGY
[content]
3.1 Research Approach
[content]`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      instructions: `Write the FULL Chapter Four content.

CRITICAL: Start with the chapter label "CHAPTER FOUR" on its own line, then the chapter title "4.0 PRESENTATION OF FINDINGS" on the next line.

Then continue with these subsections in order:
4.1 Descriptive and Demographic Results
4.2 Key Thematic or Statistical Findings
4.3 Summary of Findings

CRITICAL RULES:
- Each subsection heading should be on its own line
- Present realistic findings with percentages and frequencies
- Use plain text only, no markdown

IMPORTANT FORMAT:
CHAPTER FOUR
4.0 PRESENTATION OF FINDINGS
[content]
4.1 Descriptive and Demographic Results
[content]`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      instructions: `Write the FULL Chapter Five content.

CRITICAL: Start with the chapter label "CHAPTER FIVE" on its own line, then the chapter title "5.0 DISCUSSION" on the next line.

Then continue with these subsections in order:
5.1 Interpretation of Key Findings
5.2 Comparison with Previous Studies
5.3 Implications for Practice and Policy
5.4 Limitations of the Study

CRITICAL RULES:
- Each subsection heading should be on its own line
- Use plain text only, no markdown

IMPORTANT FORMAT:
CHAPTER FIVE
5.0 DISCUSSION
[content]
5.1 Interpretation of Key Findings
[content]`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      instructions: `Write the FULL Chapter Six content.

CRITICAL: Start with the chapter label "CHAPTER SIX" on its own line, then the chapter title "6.0 CONCLUSIONS AND RECOMMENDATIONS" on the next line.

Then continue with these subsections in order:
6.1 Conclusions
6.2 Recommendations

CRITICAL RULES:
- Each subsection heading should be on its own line
- Use plain text only, no markdown

IMPORTANT FORMAT:
CHAPTER SIX
6.0 CONCLUSIONS AND RECOMMENDATIONS
[content]
6.1 Conclusions
[content]`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES AND APPENDICES',
      instructions: `Write ONLY the following.

REFERENCES
Provide a complete list of 30 references published in the last 10 years. Use a mixture of books and journals. Include 4 research methods books. All references must be in APA 7th edition format, alphabetised by author surname. Write out every reference in full.

APPENDICES
Describe the instruments of data collection that would be included.

CRITICAL: Use plain text only. No markdown, no asterisks.`,
    },
  ];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(
  prompt: string,
  maxOutputTokens: number,
  retries = 1
): Promise<{ text: string; error: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return { text: '', error: 'GEMINI_API_KEY is not set' };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.45, maxOutputTokens },
          }),
        },
        18000
      );
      const data = await response.json();

      if (data.error) {
        const status = data.error.code || response.status;
        const message = data.error.message || JSON.stringify(data.error);
        console.error(`Gemini error (status ${status}):`, message);
        if ((status === 429 || status === 503) && attempt < retries) {
          await sleep(800);
          continue;
        }
        return { text: '', error: `Gemini ${status}: ${message}` };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const finishReason = data.candidates?.[0]?.finishReason;
      if (!text && finishReason) {
        return { text: '', error: `Gemini returned no text (finishReason: ${finishReason})` };
      }
      return { text, error: '' };
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError';
      console.error('Gemini fetch error:', e);
      if (attempt < retries && !isAbort) {
        await sleep(800);
        continue;
      }
      return { text: '', error: isAbort ? 'Gemini timed out' : `Gemini fetch failed: ${e.message || e}` };
    }
  }
  return { text: '', error: 'Gemini failed after retries' };
}

async function callOpenRouter(
  prompt: string,
  maxTokens: number
): Promise<{ text: string; error: string }> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return { text: '', error: 'OPENROUTER_API_KEY is not set' };

  try {
    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.BASE_URL || 'http://localhost:3000',
          'X-Title': 'VetSphere Academic Writer',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.45,
          max_tokens: maxTokens,
        }),
      },
      18000
    );
    const data = await response.json();
    if (data.error || !data.choices) {
      const message = data.error?.message || 'unknown OpenRouter error';
      const metadata = data.error?.metadata ? ` | ${JSON.stringify(data.error.metadata)}` : '';
      console.error('OpenRouter error:', message, metadata);
      return { text: '', error: `OpenRouter: ${message}${metadata}` };
    }
    return { text: data.choices[0]?.message?.content || '', error: '' };
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    console.error('OpenRouter fetch error:', e);
    return { text: '', error: isAbort ? 'OpenRouter timed out' : `OpenRouter fetch failed: ${e.message || e}` };
  }
}

async function callGroq(
  prompt: string,
  maxTokens: number
): Promise<{ text: string; error: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return { text: '', error: 'GROQ_API_KEY is not set' };

  try {
    const response = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.45,
          max_tokens: maxTokens,
        }),
      },
      18000
    );
    const data = await response.json();
    if (data.error || !data.choices) {
      const message = data.error?.message || 'unknown Groq error';
      console.error('Groq error:', message);
      return { text: '', error: `Groq: ${message}` };
    }
    return { text: data.choices[0]?.message?.content || '', error: '' };
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    console.error('Groq fetch error:', e);
    return { text: '', error: isAbort ? 'Groq timed out' : `Groq fetch failed: ${e.message || e}` };
  }
}

const CEREBRAS_MODEL_CANDIDATES = ['llama-3.3-70b', 'llama3.1-70b', 'llama3.1-8b'];

async function callYouCom(
  prompt: string,
  effort: 'lite' | 'standard' = 'lite'
): Promise<{ text: string; error: string }> {
  const youKey = process.env.YOU_API_KEY;
  if (!youKey) return { text: '', error: 'YOU_API_KEY is not set' };

  try {
    const response = await fetchWithTimeout(
      'https://api.you.com/v1/research',
      {
        method: 'POST',
        headers: { 'X-API-Key': youKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: prompt, research_effort: effort }),
      },
      15000
    );
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { text: '', error: `You.com HTTP ${response.status}: ${errText.slice(0, 300)}` };
    }
    const data = await response.json();
    const content = data.output?.content || '';
    if (!content || content.trim().length < 100) {
      return { text: '', error: 'You.com returned too-short or empty content' };
    }
    return { text: content, error: '' };
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    console.error('You.com fetch error:', e);
    return { text: '', error: isAbort ? 'You.com timed out' : `You.com fetch failed: ${e.message || e}` };
  }
}

async function callCerebras(
  prompt: string,
  maxTokens: number
): Promise<{ text: string; error: string }> {
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  if (!cerebrasKey) return { text: '', error: 'CEREBRAS_API_KEY is not set' };

  const errors: string[] = [];

  for (const model of CEREBRAS_MODEL_CANDIDATES) {
    try {
      const response = await fetchWithTimeout(
        'https://api.cerebras.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cerebrasKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.45,
            max_completion_tokens: maxTokens,
          }),
        },
        15000
      );
      const data = await response.json();
      if (!response.ok || data.error || !data.choices) {
        const message =
          data.error?.message || data.message || `HTTP ${response.status}: ${JSON.stringify(data)}`;
        console.error(`Cerebras error (model ${model}):`, message);
        errors.push(`${model}: ${message}`);
        continue;
      }
      return { text: data.choices[0]?.message?.content || '', error: '' };
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError';
      console.error(`Cerebras fetch error (model ${model}):`, e);
      errors.push(`${model}: ${isAbort ? 'timed out' : e.message || e}`);
    }
  }

  return { text: '', error: `Cerebras: ${errors.join(' | ')}` };
}

async function generateSection(
  sectionPrompt: string,
  maxOutputTokens: number
): Promise<{ text: string; apiUsed: string; error: string }> {
  const cerebras = await callCerebras(sectionPrompt, maxOutputTokens);
  if (cerebras.text) return { text: cerebras.text, apiUsed: 'Cerebras', error: '' };

  const groq = await callGroq(sectionPrompt, maxOutputTokens);
  if (groq.text) return { text: groq.text, apiUsed: 'Groq', error: '' };

  const openRouter = await callOpenRouter(sectionPrompt, maxOutputTokens);
  if (openRouter.text) return { text: openRouter.text, apiUsed: 'OpenRouter', error: '' };

  const gemini = await callGemini(sectionPrompt, maxOutputTokens);
  if (gemini.text) return { text: gemini.text, apiUsed: 'Gemini', error: '' };

  const youCom = await callYouCom(sectionPrompt);
  if (youCom.text) return { text: youCom.text, apiUsed: 'You.com', error: '' };

  return {
    text: '',
    apiUsed: 'none',
    error: `All providers failed: Cerebras (${cerebras.error}), Groq (${groq.error}), OpenRouter (${openRouter.error}), Gemini (${gemini.error}), You.com (${youCom.error})`,
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`/g, '')
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    .replace(/[ \t]+([.,;:])/g, '$1')
    .replace(/\.\.+/g, '.')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function generateDetailedAssignment(
  topic: string,
  typeLabel: string,
  levelInfo: { label: string; pageCount: string; depth: string }
): Promise<{ content: string; apiUsed: string }> {
  const prompt = `You are a professional academic writer producing a ${levelInfo.depth} ${typeLabel} for ${levelInfo.label}.

TOPIC: "${topic}"

Write a DETAILED ${typeLabel} with:
1.0 Title Page
2.0 Introduction
3.0 Main Body
4.0 Conclusion
5.0 References
6.0 Appendices

STYLE RULES:
- Use plain text only, no markdown
- Use APA 7th style in-text citations
- Never use numbered bracket citations
- Write in complete paragraphs`;

  const { text, apiUsed, error } = await generateSection(prompt, 3000);
  return { content: text ? cleanText(text) : '', apiUsed: error ? `${apiUsed} (${error})` : apiUsed };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level = 'degree', type = 'essay', chapterIndex = 0, previousContext = '' } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const cleanTopic = topic
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200F\uFEFF]/g, '')
      .trim();

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Assignment';

    if (type !== 'research') {
      const result = await generateDetailedAssignment(cleanTopic, typeLabel, levelInfo);
      if (!result.content) {
        return NextResponse.json(
          { error: 'Failed to generate content from any configured AI provider.' },
          { status: 502 }
        );
      }
      return NextResponse.json({
        content: result.content,
        topic: cleanTopic,
        level,
        type,
        apiUsed: result.apiUsed,
        wordCount: result.content.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
      });
    }

    const chapters = buildChapterSpecs(cleanTopic);
    const idx = Math.max(0, Math.min(chapterIndex, chapters.length - 1));
    const chapter = chapters[idx];

    const prompt = `You are an expert academic writer producing a ${levelInfo.depth} research paper section for ${levelInfo.label}.

TOPIC: "${cleanTopic}"

PREVIOUS CONTENT (for continuity):
${previousContext || 'This is the first chapter.'}

TASK: ${chapter.instructions}

CRITICAL RULES FOR CONTINUITY:
- This is a continuous academic document.
- Start with the chapter label and title exactly as specified.
- Do not repeat content from previous chapters.
- Do not re-explain the study's background or restate the problem statement.
- Use plain text only. No markdown, no asterisks, no underscores.
- Use APA 7th style in-text citations only. Never use numbered bracket citations.
- Write out full content. Never use placeholders.

FORMAT EXAMPLE FOR CHAPTERS:
CHAPTER ONE
1.0 INTRODUCTION
[content here]
1.1 Background of the Study
[content here]

Make sure the chapter label (e.g., "CHAPTER ONE") and the chapter title (e.g., "1.0 INTRODUCTION") are on separate lines.`;

    const chapterTokenBudget = chapter.id === 'references' ? 4000 : 3000;

    const { text, apiUsed, error } = await generateSection(prompt, chapterTokenBudget);

    if (!text) {
      return NextResponse.json(
        { error: `Failed to generate "${chapter.title}". ${error}` },
        { status: 502 }
      );
    }

    const cleaned = cleanText(text);
    const isLastChapter = idx === chapters.length - 1;

    const contextForNextChapter =
      chapter.id === 'frontmatter' || chapter.id === 'chapter1'
        ? `${previousContext}\n\n${cleaned}`.trim()
        : `${previousContext}\n\n${cleaned.slice(0, 1000)}...`.trim();

    return NextResponse.json({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterLabel: chapter.chapterLabel,
      content: cleaned,
      apiUsed,
      isLastChapter,
      nextChapterIndex: idx + 1,
      contextForNextChapter,
      totalChapters: chapters.length,
      topic: cleanTopic,
      level,
      type,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Academic writer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate academic content' },
      { status: 500 }
    );
  }
}
