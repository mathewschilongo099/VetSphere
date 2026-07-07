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
  instructions: string;
}

function buildChapterSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'Front Matter',
      instructions: `Write ONLY the following front-matter sections, in this order, fully written out:

1.0 Title Page
2.0 Declaration
3.0 Dedication
4.0 Acknowledgements
5.0 Abstract
6.0 List of Abbreviations and Acronyms

Do NOT write a Table of Contents section. Do not guess or invent page numbers. The Table of Contents is generated separately.

IMPORTANT: The title and framing established here are FINAL. Every later chapter must stay consistent with them.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      instructions: `Write the FULL Chapter One: Introduction. Use these exact numbered subsections:

1.0 Introduction (a short paragraph explaining what the chapter covers)
1.1 Background of the Study (six paragraphs deep into global, regional and national status quo, mention different countries as examples, cite with references published in the last 10 years)
1.2 Statement of the Problem (one paragraph, 100 words, convincing, cite as evidence)
1.3 Research Objectives
1.3.1 General Objective (clear, 20 to 25 words)
1.3.2 Specific Objectives (only 3 specific objectives)
1.4 Research Questions (turn objectives to questions)
1.5 Significance of the Study
1.6 Scope of Study (60 words)
1.7 Operational Definitions (5 key words)

Ground every claim in real, verifiable knowledge. Use in-text citations in APA 7th style. Never use numbered bracket citations. The Research Objectives and Research Questions written here are FINAL.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      instructions: `Write the FULL Chapter Two: Literature Review. Use these exact numbered subsections:

2.0 Introduction (a short paragraph explaining what the chapter covers)
2.1.0 Empirical Review (100 word paragraph, no citations)
2.1.1 Create a theme from objective 1 and present literature at all levels, cite in standard way. Move beyond description.
2.1.2 Create a theme from objective 2 and present literature at all levels, cite in standard way. Move beyond description.
2.1.3 Create a theme from objective 3 and present literature at all levels, cite in standard way. Move beyond description.
2.2 Theoretical Framework (use 2 different theories, state the theory, by who, when, what the theory is about, how the theory is linked to the current study. Maximum of 3 paragraphs)
2.3 Conceptual Framework (short explanation showing the relationship between variables, followed by an editable sketch)

This chapter must be a critical synthesis, not a list of summaries. Frame themes to support the research objectives from Chapter One.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      instructions: `Write the FULL Chapter Three: Research Methodology. Use these exact numbered subsections:

3.0 Introduction (a short paragraph explaining what the chapter covers)
3.1 Research Approach (60 words, be clear)
3.2 Research Design (90 words, be clear, cite Creswell, justify the reason for choosing the design)
3.3 Study Location (60 words)
3.4 Target Population (60 words, state the actual population)
3.5 Sample Size (show using a formula how the sample was calculated, justify the reason for the sample size)
3.6 Data Collection Instruments and Procedures (100 words, ensure to cite)
3.7 Data Analysis Plan (90 words, be clear, consistent, justify, cite)
3.8 Reliability and Validity (60 words)
3.9 Ethical Considerations (90 words, be clear)

The methodology must be designed specifically to answer the Research Questions from Chapter One.`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      instructions: `Write the FULL Chapter Four: Presentation of Findings. Use these exact numbered subsections:

4.0 Introduction (a short paragraph explaining what the chapter covers)
4.1 Descriptive and Demographic Results
4.2 Key Thematic or Statistical Findings (organised by the research objectives)
4.3 Summary of Findings

Present findings as illustrative and internally consistent. Use realistic percentages and frequencies. Each subsection needs substantive interpretation, not just numbers. Findings must directly answer the Research Questions from Chapter One.`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      instructions: `Write the FULL Chapter Five: Discussion. Use these exact numbered subsections:

5.0 Introduction (a short paragraph explaining what the chapter covers)
5.1 Interpretation of Key Findings
5.2 Comparison with Previous Studies (engage with literature from Chapter Two)
5.3 Implications for Practice and Policy
5.4 Limitations of the Study

This chapter must argue and interpret the findings from Chapter Four and engage with literature from Chapter Two.`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      instructions: `Write the FULL Chapter Six:

6.0 Introduction (a short paragraph explaining what the chapter covers)
6.1 Conclusions (directly answering the research objectives from Chapter One)
6.2 Recommendations (specific, actionable, grouped by stakeholder)

Do NOT write References or Appendices in this section.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      instructions: `Write ONLY the following:

REFERENCES
Provide a complete list of 30 references published in the last 10 years. Use credible verifiable sources, a mixture of books and journals. Include 4 research methods published books. All references must be in APA 7th edition format, alphabetised by author surname. Never abbreviate or placehold.

APPENDICES
Describe the instruments of data collection that would be included.`,
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
3.0 Main Body (organised into labelled sections appropriate to the topic)
4.0 Conclusion
5.0 References (APA 7th edition, 20-30 sources)
6.0 Appendices (brief description)

STYLE RULES:
- Simple, formal academic English
- Use APA 7th style in-text citations
- Never use numbered bracket citations
- Write in complete paragraphs
- Do not add a preamble`;

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

${previousContext ? `CONTEXT (content already established in earlier chapters). Stay consistent with the same title, research objectives, and questions:
"""
${previousContext}
"""

IMPORTANT: Do not repeat content verbatim. If this chapter has an introduction, keep it to 2-4 sentences that only transition from the previous chapter. Do not re-explain the study's background or restate the problem statement.
` : ''}

TASK: ${chapter.instructions}

STYLE RULES:
- Simple, formal academic English. No slang or emojis.
- One idea per paragraph.
- Use numbered headings exactly as specified.
- Use APA 7th style in-text citations only, e.g. (Smith, 2021).
- NEVER use numbered bracket citations like [1] or [[2]].
- Never write placeholder text like "[omitted for brevity]" or "[references truncated]".
- Write out full, complete content as instructed.`;

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
        ? `${previousContext}\n\n[${chapter.title}]\n${cleaned}`.trim()
        : `${previousContext}\n\n[${chapter.title} — excerpt]\n${cleaned.slice(0, 500)}...`.trim();

    return NextResponse.json({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
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
