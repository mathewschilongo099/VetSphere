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
  proposal: 'Research Proposal',
};

const levelMap: Record<string, { label: string; pageCount: string; depth: string }> = {
  diploma: {
    label: 'Diploma Level',
    pageCount: '15-25 pages',
    depth: 'clear, practical, and moderately detailed',
  },
  degree: {
    label: "Bachelor's Degree Level",
    pageCount: '20-30 pages',
    depth: 'detailed, well-referenced, and analytically sound',
  },
  masters: {
    label: "Master's Degree Level",
    pageCount: '25-40 pages',
    depth: 'rigorous, critically analytical, and thoroughly evidenced',
  },
  phd: {
    label: 'PhD Level',
    pageCount: '35-50 pages',
    depth: 'highly rigorous, original, critically evaluative, and exhaustively evidenced',
  },
};

interface ChapterSpec {
  id: string;
  title: string;
  chapterLabel: string;
  chapterNumber: string;
  instructions: string;
}

function buildProposalSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections for a RESEARCH PROPOSAL, in this order, fully written out with substantial content:

TITLE PAGE (with the research title, author name, degree, date)
TABLE OF CONTENTS (list all sections with page numbers as placeholders)
LIST OF ABBREVIATIONS AND ACRONYMS

Do NOT write any chapter content yet. Stop after the abbreviations list.

CRITICAL: Use plain text only. No markdown, no asterisks for bold. Write headings in ALL CAPS as shown above.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter One for a RESEARCH PROPOSAL.

CRITICAL FORMAT:
Start with "CHAPTER ONE" on its own line.
Then on the next line, write "1.0 INTRODUCTION".
Then write a substantial paragraph explaining what the chapter covers.

Required subsections with EXACT specifications and DEPTH requirements:
1.1 Background of the Study: Write 6 SUBSTANTIAL paragraphs (each 6-8 sentences minimum) covering global, regional and national status quo. Mention different countries as examples with specific statistics and context. Cite with references published in the last 10 years. Each paragraph must be detailed and informative.

1.2 Statement of the Problem: Write 1 SUBSTANTIAL paragraph of approximately 150-200 words that is convincing, uses evidence, and clearly articulates the research gap.

1.3 Research Objectives:
1.3.1 General Objective (clear, 20 to 25 words)
1.3.2 Specific Objectives (exactly 3 specific objectives, each clearly stated)

1.4 Research Questions (turn the 3 objectives into clear, specific questions)

1.5 Significance of the Study: Write 2-3 substantial paragraphs explaining the significance to different stakeholders.

1.6 Scope of Study: Write 1 substantial paragraph (approximately 80-100 words) clearly defining boundaries.

1.7 Operational Definitions: Define exactly 5 key terms with clear, academic definitions (2-3 sentences each).

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content - not brief or superficial
- Write detailed, analytical paragraphs with proper academic depth
- Use APA 7th style in-text citations throughout
- Never use numbered bracket citations
- Use plain text only, no markdown

EXACT FORMAT REQUIRED:
CHAPTER ONE
1.0 INTRODUCTION
[substantial paragraph]
1.1 Background of the Study
[six substantial paragraphs with citations]
1.2 Statement of the Problem
[one substantial paragraph of 150-200 words]`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Two for a RESEARCH PROPOSAL.

CRITICAL FORMAT:
Start with "CHAPTER TWO" on its own line.
Then on the next line, write "2.0 INTRODUCTION".
Then write a substantial paragraph explaining what the chapter covers.

Required subsections with EXACT specifications and DEPTH requirements:
2.1.0 Empirical Review: Write exactly 100-150 words with NO citations - a synthesis of the research landscape.

2.1.1 Theme from Objective 1: Write 3-4 SUBSTANTIAL paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize.

2.1.2 Theme from Objective 2: Write 3-4 SUBSTANTIAL paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize.

2.1.3 Theme from Objective 3: Write 3-4 SUBSTANTIAL paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize.

2.2 Theoretical Framework: Use exactly 2 different theories. For each theory, state the theory, by whom, when, what the theory is about, and how the theory is linked to the current study. Write 4-5 substantial paragraphs total.

2.3 Conceptual Framework: Write a substantial explanation showing the relationship between variables, followed by a detailed editable sketch described in words.

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content - not brief or superficial
- Write detailed, analytical paragraphs with proper academic depth
- Use APA 7th style in-text citations
- Use plain text only, no markdown

EXACT FORMAT REQUIRED:
CHAPTER TWO
2.0 INTRODUCTION
[substantial paragraph]
2.1.0 Empirical Review
[100-150 words with no citations]
2.1.1 [Theme from Objective 1]
[3-4 substantial paragraphs with citations]`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Three for a RESEARCH PROPOSAL.

CRITICAL FORMAT:
Start with "CHAPTER THREE" on its own line.
Then on the next line, write "3.0 INTRODUCTION".
Then write a substantial paragraph explaining what the chapter covers.

Required subsections with EXACT specifications and DEPTH requirements:
3.1 Research Approach: Write 1 detailed paragraph (60-80 words) clearly explaining the approach and its justification.

3.2 Research Design: Write 2 detailed paragraphs (90-120 words total) clearly explaining the design, cite Creswell, justify the reason for choosing the design.

3.3 Study Location: Write 1 detailed paragraph (60-80 words) describing the location and its relevance.

3.4 Target Population: Write 1 detailed paragraph (60-80 words) stating the actual population and its characteristics.

3.5 Sample Size: Show using a formula how the sample was calculated, justify the reason for the sample size with detailed explanation.

3.6 Data Collection Instruments and Procedures: Write 2 detailed paragraphs (120-150 words total) describing instruments and procedures, ensure to cite.

3.7 Data Analysis Plan: Write 2 detailed paragraphs (120-150 words total) clearly explaining the plan, be consistent, justify, cite.

3.8 Reliability and Validity: Write 1 detailed paragraph (60-80 words) explaining measures taken.

3.9 Ethical Considerations: Write 2 detailed paragraphs (120-150 words total) clearly explaining ethical protocols.

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content - not brief or superficial
- Write detailed, analytical paragraphs with proper academic depth
- Cite Creswell for research design
- Use plain text only, no markdown

EXACT FORMAT REQUIRED:
CHAPTER THREE
3.0 INTRODUCTION
[substantial paragraph]
3.1 Research Approach
[60-80 words]`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following sections with COMPLETE content.

REFERENCES
Provide a complete list of 30 references published in the last 10 years. Use credible verifiable sources, a mixture of books and journals. Include 4 research methods published books. All references must be in APA 7th edition format, alphabetised by author surname. Write out every reference in full with complete bibliographic details.

WORK PLAN
Present a detailed work plan showing specific activities across months (e.g., Month 1: Literature Review, Month 2: Proposal Writing, etc.) with clear timelines.

BUDGET
Present a detailed budget table showing items, quantities, unit costs, and total costs in Zambian Kwacha with realistic figures.

INSTRUMENTS OF DATA COLLECTION
Describe in 3-4 substantial paragraphs the instruments that would be used (e.g., questionnaire, interview guide) with specific details about structure, content, and administration.

CRITICAL: Use plain text only. No markdown, no asterisks. Write out all content completely - no placeholders.`,
    },
  ];
}

function buildResearchSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections, in this order, fully written out with substantial content:

DECLARATION (formal declaration paragraph)
DEDICATION (sincere dedication 3-4 sentences)
ACKNOWLEDGEMENTS (substantial paragraph thanking relevant parties)
ABSTRACT (250-300 words summarizing the entire study with keywords)
LIST OF ABBREVIATIONS AND ACRONYMS

Do NOT write a Table of Contents section. Do not guess page numbers.

CRITICAL: Use plain text only. No markdown, no asterisks. Write headings in ALL CAPS.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter One.

CRITICAL FORMAT:
Start with "CHAPTER ONE" on its own line.
Then on the next line, write "1.0 INTRODUCTION".
Then write substantial content.

Required subsections:
1.1 Background of the Study (6-8 substantial paragraphs with citations)
1.2 Statement of the Problem (1 substantial paragraph)
1.3 Research Objectives (with 1.3.1 General Objective and 1.3.2 Specific Objectives - 3-5 objectives)
1.4 Research Questions (matching the objectives)
1.5 Significance of the Study (2-3 substantial paragraphs)
1.6 Scope of Study (1 substantial paragraph)
1.7 Operational Definitions (5-8 key terms with 2-3 sentence definitions)

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content
- Write detailed, analytical paragraphs
- Use APA 7th style in-text citations
- Use plain text only, no markdown

EXACT FORMAT REQUIRED:
CHAPTER ONE
1.0 INTRODUCTION
[substantial content]
1.1 Background of the Study
[6-8 substantial paragraphs]`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Two.

CRITICAL FORMAT:
Start with "CHAPTER TWO" on its own line.
Then on the next line, write "2.0 LITERATURE REVIEW".
Then write substantial content.

Required subsections:
2.1 Empirical Review (with 3-4 thematic sub-subsections each with 4-5 substantial paragraphs)
2.2 Theoretical Framework (2 theories with detailed explanation, 4-5 paragraphs)
2.3 Conceptual Framework (detailed explanation with variables described)

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content
- Write detailed, analytical paragraphs
- Use APA 7th style in-text citations
- Use plain text only, no markdown`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Three.

CRITICAL FORMAT:
Start with "CHAPTER THREE" on its own line.
Then on the next line, write "3.0 RESEARCH METHODOLOGY".
Then write substantial content.

Required subsections:
3.1 Research Approach (2-3 paragraphs)
3.2 Research Design (3-4 paragraphs, cite Creswell)
3.3 Study Location (2-3 paragraphs)
3.4 Target Population (2-3 paragraphs)
3.5 Sample Size (show formula, detailed justification)
3.6 Data Collection Instruments and Procedures (3-4 paragraphs, cite)
3.7 Data Analysis Plan (3-4 paragraphs, justify, cite)
3.8 Reliability and Validity (2-3 paragraphs)
3.9 Ethical Considerations (3-4 paragraphs)

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content
- Write detailed, analytical paragraphs
- Cite Creswell for research design
- Use plain text only, no markdown`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Four.

CRITICAL FORMAT:
Start with "CHAPTER FOUR" on its own line.
Then on the next line, write "4.0 PRESENTATION OF FINDINGS".
Then write substantial content.

Required subsections:
4.1 Descriptive and Demographic Results (3-4 paragraphs with realistic percentages)
4.2 Key Thematic or Statistical Findings (4-5 paragraphs organized by objectives)
4.3 Summary of Findings (2-3 paragraphs)

CRITICAL RULES:
- Present realistic findings with percentages and frequencies
- Each subsection must have SUBSTANTIAL content
- Use plain text only, no markdown`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Five.

CRITICAL FORMAT:
Start with "CHAPTER FIVE" on its own line.
Then on the next line, write "5.0 DISCUSSION".
Then write substantial content.

Required subsections:
5.1 Interpretation of Key Findings (4-5 substantial paragraphs)
5.2 Comparison with Previous Studies (4-5 substantial paragraphs)
5.3 Implications for Practice and Policy (3-4 substantial paragraphs)
5.4 Limitations of the Study (2-3 substantial paragraphs)

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content
- Interpret findings from Chapter Four
- Engage with literature from Chapter Two
- Use plain text only, no markdown`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write a COMPREHENSIVE and DETAILED Chapter Six.

CRITICAL FORMAT:
Start with "CHAPTER SIX" on its own line.
Then on the next line, write "6.0 CONCLUSIONS AND RECOMMENDATIONS".
Then write substantial content.

Required subsections:
6.1 Conclusions (4-5 substantial paragraphs)
6.2 Recommendations (3-4 substantial paragraphs grouped by stakeholder)

CRITICAL RULES:
- DO NOT include a 6.0 Introduction subsection
- Each subsection must have SUBSTANTIAL content
- Use plain text only, no markdown

EXACT FORMAT REQUIRED:
CHAPTER SIX
6.0 CONCLUSIONS AND RECOMMENDATIONS
[substantial content]
6.1 Conclusions
[4-5 substantial paragraphs]
6.2 Recommendations
[3-4 substantial paragraphs]`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following with COMPLETE content.

REFERENCES
Provide a complete list of 30 references published in the last 10 years. Use a mixture of books and journals. Include 4 research methods books. All references must be in APA 7th edition format, alphabetised by author surname. Write out every reference in full.

APPENDICES
Describe in 3-4 substantial paragraphs the instruments of data collection that would be included.`,
    },
  ];
}

function buildChapterSpecs(topic: string, docType: string): ChapterSpec[] {
  if (docType === 'proposal') {
    return buildProposalSpecs(topic);
  }
  return buildResearchSpecs(topic);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level = 'degree', type = 'research', chapterIndex = 0, previousContext = '' } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const cleanTopic = topic
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200F\uFEFF]/g, '')
      .trim();

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Research Paper';

    const chapters = buildChapterSpecs(cleanTopic, type);
    const idx = Math.max(0, Math.min(chapterIndex, chapters.length - 1));
    const chapter = chapters[idx];

    const totalChapters = type === 'proposal' ? 5 : 8;

    // Special instruction for depth
    let depthInstruction = `
CRITICAL DEPTH REQUIREMENT:
This is a ${levelInfo.label} academic document. The content must be COMPREHENSIVE and THOROUGH.
- Write SUBSTANTIAL paragraphs (minimum 5-7 sentences per paragraph for main content)
- Provide detailed analysis, not brief summaries
- Include specific examples, statistics, and evidence
- Write 2-3 paragraphs per subsection where appropriate
- The document should reflect ${levelInfo.depth}
- Do not be brief or superficial - this is a serious academic work
`;

    let chapterSpecificInstruction = '';
    if (type === 'proposal') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER ONE SPECIFICS:
- 1.1 Background: exactly 6 substantial paragraphs (each 6-8 sentences)
- 1.2 Statement of Problem: 150-200 words with citations
- 1.6 Scope of Study: 80-100 words
- 1.7 Operational Definitions: 5 terms with 2-3 sentence definitions each`;
      }
      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER TWO SPECIFICS:
- 2.1.0 Empirical Review: 100-150 words, NO citations
- 2.1.1, 2.1.2, 2.1.3: Each 3-4 substantial paragraphs
- 2.2 Theoretical Framework: 4-5 substantial paragraphs total
- 2.3 Conceptual Framework: Detailed explanation with variables`;
      }
      if (chapter.id === 'chapter3') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER THREE SPECIFICS:
- Each subsection must be comprehensive and detailed
- 3.2 Research Design: 90-120 words, cite Creswell
- 3.5 Sample Size: Show formula and detailed justification
- 3.6 Data Collection: 120-150 words, cite sources
- 3.7 Data Analysis: 120-150 words, justify, cite
- 3.9 Ethical Considerations: 120-150 words`;
      }
      if (chapter.id === 'references') {
        chapterSpecificInstruction = `
PROPOSAL REFERENCES SPECIFICS:
- 30 complete APA 7th references
- 4 research methods books
- Work Plan with specific activities and timelines
- Budget table in Zambian Kwacha
- 3-4 paragraphs describing instruments`;
      }
    } else {
      // Research paper specs
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER ONE SPECIFICS:
- 1.1 Background: 6-8 substantial paragraphs with citations
- 1.2 Statement of Problem: 1 substantial paragraph
- 1.5 Significance: 2-3 substantial paragraphs
- 1.7 Operational Definitions: 5-8 terms with 2-3 sentence definitions`;
      }
      if (chapter.id === 'chapter6') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER SIX SPECIFICS:
- DO NOT include "6.0 Introduction" subsection
- 6.1 Conclusions: 4-5 substantial paragraphs
- 6.2 Recommendations: 3-4 substantial paragraphs grouped by stakeholder`;
      }
    }

    const prompt = `You are an expert academic writer producing a ${levelInfo.depth} ${typeLabel} for ${levelInfo.label}.

TOPIC: "${cleanTopic}"

${depthInstruction}

PREVIOUS CONTENT (for continuity):
${previousContext || 'This is the first section.'}

TASK: ${chapter.instructions}
${chapterSpecificInstruction}

CRITICAL RULES:
- This is a continuous academic document
- Start with the chapter label exactly as specified
- Write SUBSTANTIAL, DETAILED content - never brief or superficial
- Each paragraph should be 5-7 sentences minimum for main content
- Use APA 7th style in-text citations throughout
- Never use numbered bracket citations like [1]
- Use plain text only. No markdown, no asterisks, no underscores
- Avoid the use of hyphens or dashes throughout
- Write out full content. Never use placeholders
- The document must demonstrate ${levelInfo.depth} academic writing`;

    const chapterTokenBudget = chapter.id === 'references' ? 4500 : 3500;

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
      chapterNumber: chapter.chapterNumber,
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
