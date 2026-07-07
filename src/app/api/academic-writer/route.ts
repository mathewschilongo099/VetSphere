// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Each request now generates ONE chapter, so this easily fits inside
// Vercel Hobby's 60s hard cap (maxDuration only matters on Pro/Team, but
// keeping it here is harmless).
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ============================================================
// CONFIG
// ============================================================
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
      instructions: `Write ONLY the following front-matter sections, in this order, fully written out (not placeholders):
1.0 Title Page (a compelling, specific title derived from the topic; author line "VetSphere Academic Writer"; degree; date)
2.0 Declaration (standard academic declaration paragraph)
3.0 Dedication (short, sincere, 2-4 sentences)
4.0 Acknowledgements (short, sincere paragraph)
5.0 Abstract (300-350 words, written last-conceptually: state the problem, approach, key findings/arguments, and significance)
6.0 List of Abbreviations and Acronyms (only abbreviations that are actually relevant to this specific topic — do not invent irrelevant ones)

Do NOT write a Table of Contents section. Do not guess or invent page numbers for any section — you cannot know real page numbers, and a fabricated Table of Contents is worse than none at all. The document's real Table of Contents, with accurate page numbers, is generated separately from the finished PDF.

Do not write Chapter One or any chapter content yet — stop after the abbreviations list.

IMPORTANT: The title you invent here, and the framing of the problem in the Abstract, are FINAL. Every later chapter must stay consistent with them.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      instructions: `Write the FULL Chapter One: Introduction. Use these exact numbered subsections, each with 3-6 well-developed paragraphs (one idea per paragraph, no filler, no repetition):
1.0 Introduction
1.1 Background of the Study
1.2 Statement of the Problem
1.3 Research Objectives (1.3.1 General Objective; 1.3.2 Specific Objectives — 3 to 5 specific objectives)
1.4 Research Questions (matching the specific objectives)
1.5 Significance of the Study
1.6 Scope of Study
1.7 Operational Definitions (define 5-8 key terms specific to this topic)

Ground every claim in real, verifiable veterinary/scientific knowledge. Use in-text citations in APA 7th style, e.g. (Smith, 2021) or Smith (2021) argued that..., referencing real, plausible authors and years appropriate to the field — never fabricate exact statistics or quotes, but reasonable attributed claims are fine.

IMPORTANT: The Research Objectives, Research Questions, and Operational Definitions you write here are FINAL. Every later chapter must refer back to these exact same objectives/questions/terms — never introduce different ones.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      instructions: `Write the FULL Chapter Two: Literature Review. Use these exact numbered subsections:
2.0 Introduction
2.1 Empirical Review (break this into 3-5 relevant thematic sub-subsections, e.g. 2.1.1, 2.1.2, 2.1.3, each covering a distinct theme relevant to the topic, each with 3-5 paragraphs synthesising prior research, agreements and disagreements between scholars, and gaps)
2.2 Theoretical Framework (identify and explain one or two theories/models genuinely relevant to this topic)
2.3 Conceptual Framework (explain the relationships between key variables/concepts; you may describe a conceptual diagram in words)

This chapter should read as a genuine critical synthesis of literature, not a list of summaries — compare, contrast, and evaluate sources against each other. Frame the themes so they clearly support the research objectives already established in Chapter One.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      instructions: `Write the FULL Chapter Three: Research Methodology. Use these exact numbered subsections, each with 2-4 solid paragraphs, methodologically sound and consistent with the topic and study level:
3.0 Introduction
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sample Size (justify with a rationale, e.g. Yamane's formula or similar where appropriate)
3.6 Data Collection Instruments and Procedures
3.7 Data Analysis Plan
3.8 Reliability and Validity
3.9 Ethical Considerations (informed consent, confidentiality, ethical approval)

The methodology must be designed specifically to answer the Research Questions established in Chapter One — do not introduce a different research focus.`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      instructions: `Write the FULL Chapter Four: Presentation of Findings. Use these exact numbered subsections:
4.0 Introduction
4.1 Descriptive/Demographic Results
4.2 Key Thematic or Statistical Findings (2-3 relevant subsections depending on the topic)
4.3 Summary of Findings

Present findings as illustrative but realistic and internally consistent (percentages, frequencies, or thematic patterns that add up sensibly). Where useful, describe a table in words (e.g. "Table 4.1 shows that...") rather than fabricating a rigid ASCII table. Each subsection needs 3-5 paragraphs of substantive interpretation, not just numbers.

Findings must directly answer the Research Questions/Objectives from Chapter One and be collected using the exact methodology described in Chapter Three — do not contradict either.`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      instructions: `Write the FULL Chapter Five: Discussion. Use these exact numbered subsections, each with 3-5 paragraphs:
5.0 Introduction
5.1 Interpretation of Key Findings
5.2 Comparison with Previous Studies (explicitly engage with the literature from Chapter Two — agree, disagree, extend)
5.3 Implications for Practice/Policy
5.4 Limitations of the Study

This chapter must genuinely argue and interpret the specific findings already presented in Chapter Four, and engage with the specific literature themes from Chapter Two — not restate Chapter Four in different words, and not introduce new findings or literature not seen before.`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      instructions: `Write the FULL Chapter Six:
6.0 Introduction (2-3 sentences only — a brief transition, not a restatement of the study)
6.1 Conclusions (directly answering the research objectives/questions from Chapter One)
6.2 Recommendations (specific, actionable, grouped by stakeholder if relevant — e.g. practitioners, policymakers, future researchers)

Conclusions must map 1:1 onto the exact Research Objectives from Chapter One — do not introduce new objectives here. Do NOT write References or Appendices in this section — those come in a separate chapter.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      instructions: `Write ONLY the following — do not write any chapter content, conclusions, or recommendations here:

REFERENCES
Provide the FULL, complete list of 20-35 APA 7th edition references consistent with a study on "${topic}". They must be written out in full — never abbreviated, never a placeholder, never a note saying references are "omitted for brevity" or similar. Every single reference must be a complete APA 7th-formatted entry (author(s), year, title, source). They should look like real, plausible veterinary/scientific/education literature (realistic author names, plausible journal titles, years spread 2014-2025). Alphabetised by author surname.

APPENDICES
Briefly describe what would be included (e.g. data collection tool, consent form) in 1-2 short paragraphs — no need to write them out in full.

CRITICAL: You MUST write out all 20-35 references individually and completely. Do not summarize, truncate, or state that references are omitted — that is not acceptable under any circumstance.`,
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
      15000 // kept short deliberately — see notes below on the 60s budget
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

// NOTE ON TIMEOUTS: all per-provider timeouts above were shortened from 45s/90s
// down to 15-18s. On Hobby you only have 60s TOTAL for the whole request, so
// the old 45s-per-provider timeouts meant even ONE fallback (e.g. Cerebras
// failing over then Groq succeeding) could alone exceed your entire budget.
// Short timeouts + fast fallthrough is the right tradeoff here: it's better
// to try 3 providers at 15s each than get killed mid-way through 1 provider
// at 45s.
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

  // You.com moved to last: it's a research/search API, inherently the
  // slowest of the five, and least likely to return before the 60s wall
  // if it's reached this late in the chain.
  const youCom = await callYouCom(sectionPrompt);
  if (youCom.text) return { text: youCom.text, apiUsed: 'You.com', error: '' };

  return {
    text: '',
    apiUsed: 'none',
    error: `Cerebras failed (${cerebras.error}); Groq failed (${groq.error}); OpenRouter failed (${openRouter.error}); Gemini failed (${gemini.error}); You.com failed (${youCom.error})`,
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
    // Stripping bracket citations above can leave a dangling space before
    // punctuation (e.g. "...backgrounds [3]." -> "...backgrounds ." once
    // "[3]" is removed). This shows up mainly in You.com output, which
    // cites with numeric brackets rather than APA (Author, Year) style.
    // Collapse leftover "<space>." / "<space>," / "<space>;" / "<space>:"
    // back to normal punctuation spacing.
    .replace(/[ \t]+([.,;:])/g, '$1')
    // Can also leave doubled sentence-enders ("...UNZA .."); collapse those.
    .replace(/\.\.+/g, '.')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================
// ASSIGNMENT / REPORT / CASE STUDY (single call — unchanged in shape)
// ============================================================
async function generateDetailedAssignment(
  topic: string,
  typeLabel: string,
  levelInfo: { label: string; pageCount: string; depth: string }
): Promise<{ content: string; apiUsed: string }> {
  const prompt = `You are a veterinary professional writing a ${levelInfo.depth} ${typeLabel} for ${levelInfo.label}.

TOPIC: "${topic}"

Write a DETAILED, practical ${typeLabel} with:
1.0 Title Page
2.0 Introduction
3.0 Main Body (organised into clearly labelled sections/subsections appropriate to the topic, each with 3-6 well-developed paragraphs — one idea per paragraph)
4.0 Conclusion (no new information)
5.0 References (APA 7th edition — 10-20 plausible, relevant sources)
6.0 Appendices (brief description only, if relevant)

STYLE RULES:
- Simple, formal academic English, no slang or emojis.
- Use in-text citations in APA 7th style throughout the main body, e.g. (Smith, 2021). NEVER use numbered bracket citations like [1] or [[2]] — those get stripped out downstream and will leave broken, incomplete sentences.
- Justify main body text conceptually (i.e., write in complete, well-organised paragraphs, not bullet fragments), except where a table or list is genuinely clearer.
- Do not add a preamble — start directly with the Title Page.`;

  const { text, apiUsed, error } = await generateSection(prompt, 3000);
  return { content: text ? cleanText(text) : '', apiUsed: error ? `${apiUsed} (${error})` : apiUsed };
}

// ============================================================
// ROUTE HANDLER
// ============================================================
// Request body for research papers now looks like:
// {
//   topic, level, type: 'research',
//   chapterIndex: 0,          // which chapter to generate THIS call
//   previousContext?: string  // running summary passed back by the client
// }
//
// Response for research papers:
// {
//   chapterId, chapterTitle, content, apiUsed,
//   isLastChapter, nextChapterIndex,
//   contextForNextChapter   // client must send this back as previousContext
//                           // on the NEXT call
// }
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
      .replace(/[\u200B-\u200F\uFEFF]/g, '') // strip zero-width/invisible chars
      .trim();

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Assignment';

    // --- Non-research types: unchanged, single call ---
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

    // --- Research paper: ONE chapter per request ---
    const chapters = buildChapterSpecs(cleanTopic);
    const idx = Math.max(0, Math.min(chapterIndex, chapters.length - 1));
    const chapter = chapters[idx];

    const prompt = `You are an expert veterinary academic writer producing a ${levelInfo.depth} research paper section for ${levelInfo.label} (target overall length ${levelInfo.pageCount}).

TOPIC: "${cleanTopic}"

${previousContext ? `CONTEXT — content already established earlier in this SAME paper. You MUST stay fully consistent with it: same title, same research objectives/questions, same terminology. Do NOT repeat this content verbatim, and do NOT invent a different title, objectives, or focus:
"""
${previousContext}
"""

CRITICAL — AVOID REPETITION: If this chapter has its own "X.0 Introduction" subsection, keep it to 2-4 sentences that ONLY transition from the previous chapter (e.g. "Having reviewed the literature in Chapter Two, this chapter now outlines..."). Do NOT re-explain the study's background, re-define terms, or restate the problem statement — that was already covered in Chapter One and the reader has already read it.
` : ''}
TASK: ${chapter.instructions}

STYLE RULES (must follow strictly):
- Simple, formal academic English. No slang, emojis, or informal language.
- One idea per paragraph. Avoid long unbroken blocks of text.
- Use clear numbered headings and subheadings exactly as specified above.
- Do not include any chapter other than the one requested.
- Do not add a preamble like "Here is the chapter" — output only the section content itself, starting directly with the numbered heading.
- CITATIONS: Use ONLY APA 7th-style in-text citations, e.g. (Smith, 2021) or Smith (2021) argued that... NEVER use numbered bracket citations like [1] or [[2]] — those get stripped out downstream and will leave broken, incomplete sentences.
- NEVER write placeholder text like "[omitted for brevity]", "[references truncated]", or similar shortcuts — always write out full, complete content exactly as instructed, however long it needs to be.`;

    // The references chapter needs room for 20-35 full APA entries, so it
    // gets a larger budget than the other chapters (which was the root
    // cause of references getting cut with a placeholder before).
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

    // Build what gets carried into the NEXT call. Keep it lean: full text
    // for frontmatter/chapter1 (title + objectives live there), short
    // excerpts thereafter so prompt size doesn't balloon by chapter 6.
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
