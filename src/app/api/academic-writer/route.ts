// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

const MAX_CONTEXT_CHARS = 4000;

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
    pageCount: '25-35 pages',
    depth: 'detailed, well-referenced, and analytically sound',
  },
  masters: {
    label: "Master's Degree Level",
    pageCount: '35-50 pages',
    depth: 'rigorous, critically analytical, and thoroughly evidenced',
  },
  phd: {
    label: 'PhD Level',
    pageCount: '50-80 pages',
    depth: 'highly rigorous, original, critically evaluative, and exhaustively evidenced',
  },
};

const NO_META_COMMENTARY = `
CRITICAL: NEVER include conversational meta-commentary, permission-asking, or narration.
Output ONLY the requested document content itself.
`;

const CITATION_RULES = `
CRITICAL CITATION RULES:
- CITATIONS ARE ALLOWED in: Background, Problem Statement, Significance, Scope, Operational Definitions, Literature Review, Theoretical Framework, Discussion
- CITATIONS ARE NOT ALLOWED in: 1.0 Introduction, Research Objectives, Research Questions, Findings, Conclusions, Recommendations
- Use APA 7th style naturally within the text
`;

// ============================================================
// SIMPLE ABBREVIATION RULE - ONLY 3-5 STANDARD ABBREVIATIONS
// ============================================================
const SIMPLE_ABBREVIATION_RULE = `
SIMPLE ABBREVIATION RULE - FOLLOW THIS EXACTLY:

1. ONLY include 3-5 standard abbreviations that are ACTUALLY used in the paper.
2. Use this EXACT format for the abbreviations list:
   | Abbreviation | Full Form |
   |--------------|-----------|
   | WHO | World Health Organization |
   | UNZA | University of Zambia |
   | SPSS | Statistical Package for the Social Sciences |

3. NEVER include these made-up abbreviations:
   - SMDU (Social Media Daily Use) → just write "social media use"
   - SQ (Sleep Quality) → just write "sleep quality"
   - HSS (High School Students) → just write "high school students"
   - SRS (Sleep-Related Symptoms) → just write "sleep-related symptoms"
   - IQR, CB, BLD, SRS, SRS → NEVER use these

4. If a term appears only 1-2 times, write it out in full.
5. The abbreviations list should be at the beginning ONLY. DO NOT repeat abbreviations anywhere else in the paper.

CRITICAL: Most academic papers do not need abbreviations. Write terms in full.
`;

// ============================================================
// OBJECTIVE FILL RULE WITH EXAMPLES
// ============================================================
const OBJECTIVE_FILL_RULE = `
CRITICAL OBJECTIVE RULE:

1.3.1 General Objective
Write ONE complete sentence. Example:
"To investigate the relationship between social media use and sleep quality among high school students."

1.3.2 Specific Objectives
Write 3-5 complete sentences, each numbered. Example:
"1. To examine the frequency of social media use among high school students."
"2. To investigate the relationship between social media use and sleep quality."
"3. To identify predictors of poor sleep quality."

CRITICAL: DO NOT leave 1.3.1 or 1.3.2 empty.
`;

// ============================================================
// INTERFACE DEFINITION
// ============================================================
interface ChapterSpec {
  id: string;
  title: string;
  chapterLabel: string;
  chapterNumber: string;
  instructions: string;
}

// ============================================================
// RESEARCH PAPER SPECS
// ============================================================
function buildResearchSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections:

DECLARATION
DEDICATION
ACKNOWLEDGEMENTS
ABSTRACT (200-250 words with keywords)

LIST OF ABBREVIATIONS AND ACRONYMS
[Use this EXACT format - only 3-5 standard abbreviations]
| Abbreviation | Full Form |
|--------------|-----------|
| WHO | World Health Organization |
| UNZA | University of Zambia |
| SPSS | Statistical Package for the Social Sciences |

DO NOT add more than 5 abbreviations. DO NOT invent abbreviations.
DO NOT repeat abbreviations anywhere else in the paper.

${SIMPLE_ABBREVIATION_RULE}
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPLETE and DETAILED Chapter One.

${CITATION_RULES}
${OBJECTIVE_FILL_RULE}

CHAPTER ONE
1.0 Introduction
[Write 2-3 substantial paragraphs. ABSOLUTELY NO CITATIONS HERE.]

1.1 Background to the Study
[Write 4-6 substantial paragraphs. CITATIONS ARE ALLOWED HERE.]

1.2 Statement of the Problem
[Write 2-3 substantial paragraphs. CITATIONS ARE ALLOWED HERE.]

1.3 Research Objectives
1.3.1 General Objective
[YOU MUST WRITE ONE COMPLETE SENTENCE - SEE OBJECTIVE FILL RULE ABOVE]
1.3.2 Specific Objectives
[YOU MUST WRITE 3-5 COMPLETE SENTENCES - SEE OBJECTIVE FILL RULE ABOVE]

1.4 Research Questions
[Write 3-5 questions]

1.5 Significance of the Study
[2-3 substantial paragraphs]

1.6 Scope of Study
[1-2 substantial paragraphs]

1.7 Operational Definitions
[Define 5-8 key terms]

CRITICAL: 1.3.1 and 1.3.2 MUST have content.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPLETE and DETAILED Chapter Two.

${CITATION_RULES}

CHAPTER TWO
2.0 Introduction
[1-2 paragraphs - NO citations]

2.1 Empirical Review
[Write 5-8 substantial paragraphs with citations.]

2.2 Theoretical Framework
[3-5 substantial paragraphs with citations.]

2.3 Conceptual Framework
[Explain relationships between variables. NO citations here.]

${SIMPLE_ABBREVIATION_RULE}
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPLETE and DETAILED Chapter Three.

CHAPTER THREE
3.0 Introduction
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sampling Strategy and Sample Size
3.6 Data Collection Techniques
3.7 Analysis of Data
3.8 Validity and Reliability
3.9 Ethical Considerations

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPLETE and DETAILED Chapter Four.

CHAPTER FOUR
4.0 Introduction
[1 paragraph - NO citations]

4.1 Descriptive and Demographic Results
[Present demographic data in text format.]

4.2 Key Thematic or Statistical Findings
[Present findings. NO citations.]

4.3 Summary of Findings
[2-3 paragraphs. NO citations.]

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a COMPLETE and DETAILED Chapter Five.

${CITATION_RULES}

CHAPTER FIVE
5.0 Introduction
[1 paragraph - NO citations]

5.1 Interpretation of Key Findings
[Interpret findings. Use citations.]

5.2 Comparison with Previous Studies
[Compare with literature. MUST HAVE CITATIONS.]

5.3 Implications for Practice and Policy
[Discuss implications. Use citations.]

5.4 Limitations of the Study
[Discuss limitations. NO new citations.]

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write a COMPLETE and DETAILED Chapter Six.

${CITATION_RULES}

CHAPTER SIX
6.0 Introduction
[1 paragraph - NO citations]

6.1 Conclusions
[4-6 substantial paragraphs. NO new citations.]

6.2 Recommendations
[3-5 substantial paragraphs. NO citations.]

${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write the following:

REFERENCES
Provide 25-35 complete APA 7th references.

APPENDICES
APPENDIX A: DATA EXTRACTION TOOL
APPENDIX B: PARTICIPANT INFORMATION SHEET AND INFORMED CONSENT

${NO_META_COMMENTARY}`,
    },
  ];
}

// ============================================================
// RESEARCH PROPOSAL SPECS
// ============================================================
function buildProposalSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections:

TITLE PAGE
TABLE OF CONTENTS
LIST OF ABBREVIATIONS AND ACRONYMS

${SIMPLE_ABBREVIATION_RULE}
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPLETE Chapter One.

${CITATION_RULES}
${OBJECTIVE_FILL_RULE}

CHAPTER ONE
1.0 Introduction
[NO citations]

1.1 Background to the Study
[CITATIONS ALLOWED]

1.2 Statement of the Problem
[CITATIONS ALLOWED]

1.3 Research Objectives
1.3.1 General Objective
[WRITE ONE COMPLETE SENTENCE]
1.3.2 Specific Objectives
[WRITE 3-5 COMPLETE SENTENCES]

1.4 Research Questions

1.5 Justification of the Study

1.6 Scope of Study

1.7 Operational Definitions

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write Chapter Two.

${CITATION_RULES}

CHAPTER TWO
2.0 Introduction
2.1 Empirical Review
2.2 Theoretical Framework
2.3 Conceptual Framework

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write Chapter Three.

CHAPTER THREE
3.0 Introduction
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sampling Strategy and Sample Size
3.6 Data Collection Techniques
3.7 Analysis of Data
3.8 Validity and Reliability
3.9 Ethical Considerations

${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write REFERENCES and APPENDICES.

${NO_META_COMMENTARY}`,
    },
  ];
}

// ============================================================
// ASSIGNMENT SPECS
// ============================================================
function buildAssignmentSpecs(topic: string): ChapterSpec[] {
  return [
    { id: 'title', title: 'TITLE PAGE', chapterLabel: '', chapterNumber: '', instructions: `Write TITLE PAGE. ${NO_META_COMMENTARY}` },
    { id: 'introduction', title: '1.0 INTRODUCTION', chapterLabel: '', chapterNumber: '1', instructions: `Write INTRODUCTION. ${CITATION_RULES} ${NO_META_COMMENTARY}` },
    { id: 'body', title: '2.0 MAIN BODY', chapterLabel: '', chapterNumber: '2', instructions: `Write MAIN BODY. Use APA 7th style citations. ${NO_META_COMMENTARY}` },
    { id: 'conclusion', title: '3.0 CONCLUSION', chapterLabel: '', chapterNumber: '3', instructions: `Write CONCLUSION. ${CITATION_RULES} ${NO_META_COMMENTARY}` },
    { id: 'references', title: '4.0 REFERENCES', chapterLabel: '', chapterNumber: '4', instructions: `Write REFERENCE LIST. ${NO_META_COMMENTARY}` },
  ];
}

// ============================================================
// CASE STUDY SPECS
// ============================================================
function buildCaseStudySpecs(topic: string): ChapterSpec[] {
  return [
    { id: 'frontmatter', title: 'FRONT MATTER', chapterLabel: '', chapterNumber: '', instructions: `Write front-matter sections. ${NO_META_COMMENTARY}` },
    { id: 'chapter1', title: 'CHAPTER ONE: INTRODUCTION', chapterLabel: 'CHAPTER ONE', chapterNumber: '1', instructions: `Write Chapter One. ${CITATION_RULES} ${NO_META_COMMENTARY}` },
    { id: 'chapter2', title: 'CHAPTER TWO: LITERATURE REVIEW', chapterLabel: 'CHAPTER TWO', chapterNumber: '2', instructions: `Write Chapter Two. Use APA 7th style citations. ${NO_META_COMMENTARY}` },
    { id: 'chapter3', title: 'CHAPTER THREE: RESEARCH METHODOLOGY', chapterLabel: 'CHAPTER THREE', chapterNumber: '3', instructions: `Write Chapter Three. ${NO_META_COMMENTARY}` },
    { id: 'references', title: 'REFERENCES', chapterLabel: 'REFERENCES', chapterNumber: '', instructions: `Write REFERENCE LIST. ${NO_META_COMMENTARY}` },
    { id: 'appendices', title: 'APPENDICES', chapterLabel: 'APPENDICES', chapterNumber: '', instructions: `Write APPENDICES. ${NO_META_COMMENTARY}` },
  ];
}

// ============================================================
// REPORT SPECS
// ============================================================
function buildReportSpecs(topic: string): ChapterSpec[] {
  return [
    { id: 'title', title: 'TITLE PAGE', chapterLabel: '', chapterNumber: '', instructions: `Write TITLE PAGE. ${NO_META_COMMENTARY}` },
    { id: 'executive', title: 'EXECUTIVE SUMMARY', chapterLabel: '', chapterNumber: '', instructions: `Write EXECUTIVE SUMMARY. ${CITATION_RULES} ${NO_META_COMMENTARY}` },
    { id: 'introduction', title: '1.0 INTRODUCTION', chapterLabel: '', chapterNumber: '1', instructions: `Write INTRODUCTION. ${CITATION_RULES} ${NO_META_COMMENTARY}` },
    { id: 'findings', title: '2.0 FINDINGS / RESULTS', chapterLabel: '', chapterNumber: '2', instructions: `Write FINDINGS/RESULTS. ${NO_META_COMMENTARY}` },
    { id: 'discussion', title: '3.0 DISCUSSION', chapterLabel: '', chapterNumber: '3', instructions: `Write DISCUSSION. ${NO_META_COMMENTARY}` },
    { id: 'recommendations', title: '4.0 RECOMMENDATIONS', chapterLabel: '', chapterNumber: '4', instructions: `Write RECOMMENDATIONS. ${NO_META_COMMENTARY}` },
    { id: 'conclusion', title: '5.0 CONCLUSION', chapterLabel: '', chapterNumber: '5', instructions: `Write CONCLUSION. ${CITATION_RULES} ${NO_META_COMMENTARY}` },
    { id: 'references', title: '6.0 REFERENCES', chapterLabel: '', chapterNumber: '6', instructions: `Write REFERENCE LIST. ${NO_META_COMMENTARY}` },
    { id: 'appendices', title: 'APPENDICES', chapterLabel: '', chapterNumber: '', instructions: `Write APPENDICES. ${NO_META_COMMENTARY}` },
  ];
}

// ============================================================
// BUILD CHAPTER SPECS
// ============================================================
function buildChapterSpecs(topic: string, docType: string): ChapterSpec[] {
  switch (docType) {
    case 'essay': return buildAssignmentSpecs(topic);
    case 'report': return buildReportSpecs(topic);
    case 'case-study': return buildCaseStudySpecs(topic);
    case 'proposal': return buildProposalSpecs(topic);
    case 'research':
    default: return buildResearchSpecs(topic);
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
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

// ============================================================
// AI PROVIDER FUNCTIONS
// ============================================================
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
        30000
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

  const models = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct',
  ];

  for (const model of models) {
    try {
      const response = await fetchWithTimeout(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': APP_BASE_URL,
            'X-Title': 'VetSphere Academic Writer',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.45,
            max_tokens: maxTokens,
          }),
        },
        30000
      );
      const data = await response.json();
      if (data.error || !data.choices) {
        const message = data.error?.message || 'unknown OpenRouter error';
        console.error(`OpenRouter error (${model}):`, message);
        continue;
      }
      return { text: data.choices[0]?.message?.content || '', error: '' };
    } catch (e: any) {
      console.error(`OpenRouter fetch error (${model}):`, e);
      continue;
    }
  }

  return { text: '', error: 'OpenRouter: All models failed' };
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
      30000
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

const CEREBRAS_MODEL_CANDIDATES = ['llama3.1-70b', 'llama3.1-8b'];

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
      30000
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
        30000
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
  maxOutputTokens: number,
  prioritizeGemini: boolean = false
): Promise<{ text: string; apiUsed: string; error: string }> {

  if (prioritizeGemini) {
    const gemini = await callGemini(sectionPrompt, maxOutputTokens);
    if (gemini.text) return { text: gemini.text, apiUsed: 'Gemini', error: '' };

    const groq = await callGroq(sectionPrompt, maxOutputTokens);
    if (groq.text) return { text: groq.text, apiUsed: 'Groq', error: '' };

    const openRouter = await callOpenRouter(sectionPrompt, maxOutputTokens);
    if (openRouter.text) return { text: openRouter.text, apiUsed: 'OpenRouter', error: '' };

    const cerebras = await callCerebras(sectionPrompt, maxOutputTokens);
    if (cerebras.text) return { text: cerebras.text, apiUsed: 'Cerebras', error: '' };

    const youCom = await callYouCom(sectionPrompt);
    if (youCom.text) return { text: youCom.text, apiUsed: 'You.com', error: '' };

    return {
      text: '',
      apiUsed: 'none',
      error: `All providers failed`,
    };
  }

  const groq = await callGroq(sectionPrompt, maxOutputTokens);
  if (groq.text) return { text: groq.text, apiUsed: 'Groq', error: '' };

  const openRouter = await callOpenRouter(sectionPrompt, maxOutputTokens);
  if (openRouter.text) return { text: openRouter.text, apiUsed: 'OpenRouter', error: '' };

  const gemini = await callGemini(sectionPrompt, maxOutputTokens);
  if (gemini.text) return { text: gemini.text, apiUsed: 'Gemini', error: '' };

  const cerebras = await callCerebras(sectionPrompt, maxOutputTokens);
  if (cerebras.text) return { text: cerebras.text, apiUsed: 'Cerebras', error: '' };

  const youCom = await callYouCom(sectionPrompt);
  if (youCom.text) return { text: youCom.text, apiUsed: 'You.com', error: '' };

  return {
    text: '',
    apiUsed: 'none',
    error: `All providers failed`,
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

// ============================================================
// PPTX GENERATOR
// ============================================================
async function generatePptxFromPaper(content: string, topic: string, level: string): Promise<{ buffer: Buffer; error: string }> {
  try {
    const response = await fetch(`${APP_BASE_URL}/api/python-pptx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, topic, level }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { buffer: Buffer.from(''), error: `Python PPTX error: ${response.status} - ${errorText}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, error: '' };
  } catch (error: any) {
    console.error('PPTX generation error:', error);
    return { buffer: Buffer.from(''), error: error.message || 'PPTX generation failed' };
  }
}

// ============================================================
// MAIN POST HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level = 'degree', type = 'research', chapterIndex = 0, previousContext = '', action = 'generate', content = '' } = body;

    // ============================================================
    // ACTION: PPTX
    // ============================================================
    if (action === 'pptx') {
      if (!content) {
        return NextResponse.json({ error: 'Content is required for PPTX generation' }, { status: 400 });
      }

      const result = await generatePptxFromPaper(content, topic || 'Research Presentation', level || 'Master\'s Degree');

      if (result.error || !result.buffer || result.buffer.length === 0) {
        return NextResponse.json({ error: result.error || 'PPTX generation failed' }, { status: 502 });
      }

      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(topic || 'presentation')}.pptx"`,
        },
      });
    }

    // ============================================================
    // ACTION: GENERATE
    // ============================================================
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const validTypes = ['essay', 'report', 'case-study', 'proposal', 'research'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid document type "${type}". Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const cleanTopic = topic
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200F\uFEFF]/g, '')
      .trim();

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Research Paper';

    const chapters = buildChapterSpecs(cleanTopic, type);
    const totalChapters = chapters.length;

    if (chapterIndex < 0 || chapterIndex >= chapters.length) {
      return NextResponse.json(
        { error: `Invalid chapterIndex ${chapterIndex}. This document type has ${chapters.length} chapters.` },
        { status: 400 }
      );
    }

    const idx = chapterIndex;
    const chapter = chapters[idx];

    let depthInstruction = `
CRITICAL DEPTH REQUIREMENT:
This is a ${levelInfo.label} academic document.
- Write SUBSTANTIAL paragraphs (minimum 5-7 sentences per paragraph)
- Provide detailed analysis, not brief summaries
`;

    let documentTypeInstruction = '';

    if (type === 'research') {
      documentTypeInstruction = `
THIS IS A RESEARCH PAPER.

${SIMPLE_ABBREVIATION_RULE}
${OBJECTIVE_FILL_RULE}

STRUCTURE:
1. FRONT MATTER
2. CHAPTER ONE: INTRODUCTION
3. CHAPTER TWO: LITERATURE REVIEW
4. CHAPTER THREE: RESEARCH METHODOLOGY
5. CHAPTER FOUR: PRESENTATION OF FINDINGS
6. CHAPTER FIVE: DISCUSSION
7. CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS
8. REFERENCES
9. APPENDICES

${CITATION_RULES}`;
    } else if (type === 'proposal') {
      documentTypeInstruction = `
THIS IS A RESEARCH PROPOSAL.

${SIMPLE_ABBREVIATION_RULE}
${OBJECTIVE_FILL_RULE}

STRUCTURE:
1. FRONT MATTER
2. CHAPTER ONE: INTRODUCTION
3. CHAPTER TWO: LITERATURE REVIEW
4. CHAPTER THREE: RESEARCH METHODOLOGY
5. REFERENCES
6. APPENDICES

${CITATION_RULES}`;
    } else if (type === 'essay') {
      documentTypeInstruction = `
THIS IS AN ASSIGNMENT.

STRUCTURE:
1. TITLE PAGE
2. 1.0 INTRODUCTION
3. 2.0 MAIN BODY
4. 3.0 CONCLUSION
5. 4.0 REFERENCES

${CITATION_RULES}`;
    } else if (type === 'report') {
      documentTypeInstruction = `
THIS IS A REPORT.

STRUCTURE:
1. TITLE PAGE
2. EXECUTIVE SUMMARY
3. 1.0 INTRODUCTION
4. 2.0 FINDINGS/RESULTS
5. 3.0 DISCUSSION
6. 4.0 RECOMMENDATIONS
7. 5.0 CONCLUSION
8. 6.0 REFERENCES
9. APPENDICES

${CITATION_RULES}`;
    } else if (type === 'case-study') {
      documentTypeInstruction = `
THIS IS A CASE STUDY.

STRUCTURE:
1. FRONT MATTER
2. CHAPTER ONE: INTRODUCTION
3. CHAPTER TWO: LITERATURE REVIEW
4. CHAPTER THREE: RESEARCH METHODOLOGY
5. REFERENCES
6. APPENDICES

${CITATION_RULES}`;
    }

    let chapterSpecificInstruction = '';

    if (type === 'research' || type === 'proposal') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
CRITICAL: CHAPTER ONE.
- 1.3.1 General Objective: WRITE ONE COMPLETE SENTENCE (15-25 words). MUST NOT BE EMPTY.
- 1.3.2 Specific Objectives: WRITE 3-5 COMPLETE SENTENCES. MUST NOT BE EMPTY.
- DO NOT leave these blank.`;
      }

      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
CRITICAL: CHAPTER TWO - use APA 7th style citations.`;
      }

      if (chapter.id === 'chapter4') {
        chapterSpecificInstruction = `
CRITICAL: CHAPTER FOUR - NO citations. Write findings as facts.`;
      }
    }

    if (type === 'research') {
      if (chapter.id === 'chapter6') {
        chapterSpecificInstruction = `
CRITICAL: CHAPTER SIX - NO CITATIONS.`;
      }
    }

    const prompt = `You are an expert academic writer producing a ${levelInfo.depth} ${typeLabel}.

TOPIC: "${cleanTopic}"

${documentTypeInstruction}

${depthInstruction}

PREVIOUS CONTENT:
${previousContext || 'This is the first section.'}

TASK: ${chapter.instructions}
${chapterSpecificInstruction}

${SIMPLE_ABBREVIATION_RULE}
${OBJECTIVE_FILL_RULE}
${CITATION_RULES}

CRITICAL RULES:
- Write SUBSTANTIAL, DETAILED content.
- NEVER use placeholders or leave sections empty.
- 1.3.1 and 1.3.2 MUST have actual content.
- ONLY use 3-5 standard abbreviations.
- DO NOT invent abbreviations like SMDU, SQ, SRS.
- NEVER repeat the abbreviation list anywhere else in the paper.
- NEVER include conversational meta-commentary.`;

    const chapterTokenBudget = chapter.id === 'references' ? 6000 : 4000;
    const prioritizeGemini = chapter.id === 'references';

    const { text, apiUsed, error } = await generateSection(prompt, chapterTokenBudget, prioritizeGemini);

    if (!text) {
      return NextResponse.json(
        { error: `Failed to generate "${chapter.title}". ${error}` },
        { status: 502 }
      );
    }

    const cleaned = cleanText(text);
    const isLastChapter = idx === chapters.length - 1;

    const combinedContext = `${previousContext}\n\n${cleaned}`.trim();
    const contextForNextChapter =
      combinedContext.length > MAX_CONTEXT_CHARS
        ? `${combinedContext.slice(0, MAX_CONTEXT_CHARS)}...`
        : combinedContext;

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
      totalChapters,
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
