// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Allow this route to run long enough for multi-chapter generation on Vercel.
// (Requires a Pro/Team plan for >60s; on Hobby this caps at 60s — see notes below.)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ============================================================
// CONFIG
// ============================================================
const GEMINI_MODEL = 'gemini-2.5-flash'; // matches the rest of VetSphere's AI pipeline

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

// A chapter is generated in its own call so the model can go deep on that
// chapter alone, instead of thinly covering 15 sections in one shot.
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
5.0 Table of Contents (list every chapter and major subsection listed below, matching numbering exactly, with plausible page numbers)
6.0 Abstract (300-350 words, written last-conceptually: state the problem, approach, key findings/arguments, and significance)
7.0 List of Abbreviations and Acronyms (only abbreviations that are actually relevant to this specific topic — do not invent irrelevant ones)

Do not write Chapter One or any chapter content yet — stop after the abbreviations list.`,
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

Ground every claim in real, verifiable veterinary/scientific knowledge. Use in-text citations in APA 7th style, e.g. (Smith, 2021) or Smith (2021) argued that..., referencing real, plausible authors and years appropriate to the field — never fabricate exact statistics or quotes, but reasonable attributed claims are fine.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      instructions: `Write the FULL Chapter Two: Literature Review. Use these exact numbered subsections:
2.0 Introduction
2.1 Empirical Review (break this into 3-5 relevant thematic sub-subsections, e.g. 2.1.1, 2.1.2, 2.1.3, each covering a distinct theme relevant to the topic, each with 3-5 paragraphs synthesising prior research, agreements and disagreements between scholars, and gaps)
2.2 Theoretical Framework (identify and explain one or two theories/models genuinely relevant to this topic)
2.3 Conceptual Framework (explain the relationships between key variables/concepts; you may describe a conceptual diagram in words)

This chapter should read as a genuine critical synthesis of literature, not a list of summaries — compare, contrast, and evaluate sources against each other.`,
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
3.9 Ethical Considerations (informed consent, confidentiality, ethical approval)`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      instructions: `Write the FULL Chapter Four: Presentation of Findings. Use these exact numbered subsections:
4.0 Introduction
4.1 Descriptive/Demographic Results
4.2 Key Thematic or Statistical Findings (2-3 relevant subsections depending on the topic)
4.3 Summary of Findings

Present findings as illustrative but realistic and internally consistent (percentages, frequencies, or thematic patterns that add up sensibly). Where useful, describe a table in words (e.g. "Table 4.1 shows that...") rather than fabricating a rigid ASCII table. Each subsection needs 3-5 paragraphs of substantive interpretation, not just numbers.`,
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

This chapter must genuinely argue and interpret, not just restate Chapter Four.`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      instructions: `Write the FULL Chapter Six plus References and Appendices:
6.0 Introduction
6.1 Conclusions (directly answering the research objectives/questions from Chapter One)
6.2 Recommendations (specific, actionable, grouped by stakeholder if relevant — e.g. practitioners, policymakers, future researchers)

Then:
REFERENCES
Provide 20-35 APA 7th edition references consistent with a study on "${topic}". They should look like real, plausible veterinary/scientific literature (realistic author names, plausible journal titles, years spread 2014-2025). Alphabetised.

APPENDICES
Briefly describe what would be included (e.g. data collection tool, consent form) in 1-2 short paragraphs — no need to write them out in full.`,
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
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens,
            },
          }),
        },
        45000
      );
      const data = await response.json();

      if (data.error) {
        const status = data.error.code || response.status;
        const message = data.error.message || JSON.stringify(data.error);
        console.error(`Gemini error (status ${status}):`, message);

        // 429 = rate limit / quota exceeded. Back off and retry once.
        if ((status === 429 || status === 503) && attempt < retries) {
          await sleep(1500);
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
        await sleep(1500);
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
      45000
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
      45000
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

// Not every free Cerebras account has access to every model — llama-3.3-70b in
// particular can require separate approval. llama3.1-8b is the one reliably
// available on every free account, so it's the last resort in this list.
const CEREBRAS_MODEL_CANDIDATES = ['llama-3.3-70b', 'llama3.1-70b', 'llama3.1-8b'];

// You.com's Research API actually does live web research to ground its answer,
// rather than pure generation — so it's slower (real searches happen) but
// doesn't depend on the same LLM-inference rate limits as the other
// providers. This mirrors the exact working call already used in
// autopublish/route.ts.
async function callYouCom(
  prompt: string,
  effort: 'lite' | 'standard' = 'standard'
): Promise<{ text: string; error: string }> {
  const youKey = process.env.YOU_API_KEY;
  if (!youKey) return { text: '', error: 'YOU_API_KEY is not set' };

  try {
    const response = await fetchWithTimeout(
      'https://api.you.com/v1/research',
      {
        method: 'POST',
        headers: {
          'X-API-Key': youKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: prompt,
          research_effort: effort,
        }),
      },
      90000 // Research API runs real searches, so give it more time than pure-inference providers.
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
        45000
      );
      const data = await response.json();
      if (!response.ok || data.error || !data.choices) {
        // Cerebras returns errors as a flat object: {"message": "...", "type": "...", "code": "..."}
        // — not nested under `data.error` like OpenAI/Gemini/Groq — so check both shapes.
        const message =
          data.error?.message || data.message || `HTTP ${response.status}: ${JSON.stringify(data)}`;
        console.error(`Cerebras error (model ${model}):`, message);
        errors.push(`${model}: ${message}`);
        // "does not exist or you do not have access" means try the next model.
        // Anything else (rate limit, server error) also just moves on to the next candidate.
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
  // Cerebras first: 1M tokens/day free, by far the most generous quota.
  // Groq next: solid but shares a per-key daily token budget with other
  // VetSphere features. OpenRouter next (shared/flaky free routing).
  // You.com next: proven working elsewhere in VetSphere (autopublish), but
  // it's a research/search API under the hood so it's slower and burns
  // credits rather than being purely rate-limited.
  // Gemini last: only ~20 requests/day and shared with autopublish.
  const cerebras = await callCerebras(sectionPrompt, maxOutputTokens);
  if (cerebras.text) return { text: cerebras.text, apiUsed: 'Cerebras', error: '' };

  const groq = await callGroq(sectionPrompt, maxOutputTokens);
  if (groq.text) return { text: groq.text, apiUsed: 'Groq', error: '' };

  const openRouter = await callOpenRouter(sectionPrompt, maxOutputTokens);
  if (openRouter.text) return { text: openRouter.text, apiUsed: 'OpenRouter', error: '' };

  const youCom = await callYouCom(sectionPrompt);
  if (youCom.text) return { text: youCom.text, apiUsed: 'You.com', error: '' };

  const gemini = await callGemini(sectionPrompt, maxOutputTokens);
  if (gemini.text) return { text: gemini.text, apiUsed: 'Gemini', error: '' };

  return {
    text: '',
    apiUsed: 'none',
    error: `Cerebras failed (${cerebras.error}); Groq failed (${groq.error}); OpenRouter failed (${openRouter.error}); You.com failed (${youCom.error}); Gemini failed (${gemini.error})`,
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`/g, '')
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '') // strip You.com-style citation markers like [[1]]
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '') // strip [1], [2,3] style markers
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================
// RESEARCH PAPER: generated chapter-by-chapter for real depth
// ============================================================
async function generateFullResearchPaper(
  topic: string,
  levelInfo: { label: string; pageCount: string; depth: string }
): Promise<{ content: string; apiUsedList: string[] }> {
  const chapters = buildChapterSpecs(topic);
  const generatedParts: string[] = [];
  const apiUsedList: string[] = [];

  // Sequential, not parallel: free-tier providers (Groq TPM, Gemini RPD,
  // OpenRouter RPM) are shared per-key limits, so firing 6-7 chapters at once
  // instantly exhausts them (this is what caused every chapter to fail at
  // once). ~3000 tokens is a realistic, well-developed chapter length and
  // keeps each single request safely under Groq's per-minute token budget.
  // A short gap between chapters keeps us under per-minute request limits too.
  const TOKENS_PER_CHAPTER = 3000;

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    if (i > 0) await sleep(4000);

    const prompt = `You are an expert veterinary academic writer producing a ${levelInfo.depth} research paper section for ${levelInfo.label} (target overall length ${levelInfo.pageCount}).

TOPIC: "${topic}"

TASK: ${chapter.instructions}

STYLE RULES (must follow strictly):
- Simple, formal academic English. No slang, emojis, or informal language.
- One idea per paragraph. Avoid long unbroken blocks of text.
- Use clear numbered headings and subheadings exactly as specified above.
- Do not include any chapter other than the one requested.
- Do not add a preamble like "Here is the chapter" — output only the section content itself, starting directly with the numbered heading.`;

    const { text, apiUsed, error } = await generateSection(prompt, TOKENS_PER_CHAPTER);
    apiUsedList.push(`${chapter.id}: ${apiUsed}${error ? ` (${error})` : ''}`);

    if (text) {
      generatedParts.push(cleanText(text));
    } else {
      generatedParts.push(
        `${chapter.title}\n\n[This section could not be generated. Reason: ${error || 'unknown error'}]`
      );
    }
  }

  return { content: generatedParts.join('\n\n'), apiUsedList };
}

// ============================================================
// ASSIGNMENT / REPORT / CASE STUDY (shorter — single call is fine)
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
- Use in-text citations in APA 7th style throughout the main body.
- Justify main body text conceptually (i.e., write in complete, well-organised paragraphs, not bullet fragments), except where a table or list is genuinely clearer.
- Do not add a preamble — start directly with the Title Page.`;

  const { text, apiUsed, error } = await generateSection(prompt, 4000);
  return { content: text ? cleanText(text) : '', apiUsed: error ? `${apiUsed} (${error})` : apiUsed };
}

// ============================================================
// ROUTE HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level = 'degree', type = 'essay' } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const cleanTopic = topic
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[‎]/g, '')
      .trim();

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Assignment';

    let aiResponse = '';
    let apiUsed = '';

    if (type === 'research') {
      console.log('🔬 Generating full research paper chapter-by-chapter...');
      const { content, apiUsedList } = await generateFullResearchPaper(cleanTopic, levelInfo);
      aiResponse = content;
      apiUsed = apiUsedList.join(', ');
    } else {
      const result = await generateDetailedAssignment(cleanTopic, typeLabel, levelInfo);
      aiResponse = result.content;
      apiUsed = result.apiUsed || 'none';
    }

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to generate content from any configured AI provider. Check GEMINI_API_KEY / OPENROUTER_API_KEY.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content: aiResponse,
      topic: cleanTopic,
      level,
      type,
      apiUsed,
      wordCount: aiResponse.split(/\s+/).length,
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
