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

// ============================================================
// PROPOSAL SPECS – follows the PROPOSAL PROMPT.docx exactly
// ============================================================
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
Then write a short paragraph explaining what the chapter covers.

Required subsections with EXACT specifications and DEPTH requirements:

1.1 Background of the Study: Write 6 SUBSTANTIAL paragraphs (each 6-8 sentences minimum) covering global, regional and national status quo. Mention different countries as examples with specific statistics and context. Cite with references published in the last 10 years. Each paragraph must be detailed and informative.

1.2 Statement of the Problem: Write 1 SUBSTANTIAL paragraph of approximately 100 words that is convincing, uses evidence, and clearly articulates the research gap.

1.3 Research Objectives: Write a short introductory sentence (e.g., "The following objectives guide this investigation:") before listing the objectives.
1.3.1 General Objective: Clear, 20 to 25 words.
1.3.2 Specific Objectives: EXACTLY 3 specific objectives. Each should be specific, measurable, and actionable.

1.4 Research Questions: Write a short introductory sentence (e.g., "To address the objectives, the study seeks to answer the following questions:") before listing the questions. EXACTLY 3 research questions that directly correspond to the 3 specific objectives.

1.5 Significance of the Study: Write 2-3 substantial paragraphs explaining the significance to different stakeholders (university, students, policymakers, society).

1.6 Scope of Study: Write 1 paragraph (approximately 60 words) clearly defining boundaries (geographical, temporal, and population scope).

1.7 Operational Definitions: Define exactly 5 key terms with 2-3 sentences each.

CRITICAL RULES:
- You MUST write EXACTLY 3 specific objectives and EXACTLY 3 research questions.
- Include introductory sentences for 1.3 and 1.4 as specified.
- Each subsection must have SUBSTANTIAL content.
- Write detailed, analytical paragraphs.
- Use APA 7th style in-text citations throughout.
- Never use numbered bracket citations.
- Use plain text only, no markdown.

EXACT FORMAT REQUIRED:
CHAPTER ONE
1.0 INTRODUCTION
[short paragraph explaining what the chapter covers]
1.1 Background of the Study
[six substantial paragraphs with citations]
1.2 Statement of the Problem
[one paragraph of approximately 100 words]
1.3 Research Objectives
[Introductory sentence: "The following objectives guide this investigation:"]
1.3.1 General Objective
[20 to 25 words]
1.3.2 Specific Objectives
1. [First specific objective]
2. [Second specific objective]
3. [Third specific objective]
1.4 Research Questions
[Introductory sentence: "To address the objectives, the study seeks to answer the following questions:"]
1. [First research question]
2. [Second research question]
3. [Third research question]
1.5 Significance of the Study
[2-3 substantial paragraphs]
1.6 Scope of Study
[approximately 60 words]
1.7 Operational Definitions
[5 key terms with definitions]`,
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
Then write a short paragraph explaining what the chapter covers.

Required subsections with EXACT specifications and DEPTH requirements:
2.1.0 Empirical Review: Write exactly 100 words with NO citations - a synthesis of the research landscape.

2.1.1 Theme from Objective 1: Write 3-4 SUBSTANTIAL paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize.

2.1.2 Theme from Objective 2: Write 3-4 SUBSTANTIAL paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize.

2.1.3 Theme from Objective 3: Write 3-4 SUBSTANTIAL paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize.

2.2 Theoretical Framework: Use exactly 2 different theories. For each theory, state the theory, by whom, when, what the theory is about, and how the theory is linked to the current study. Write 4-5 substantial paragraphs total.

2.3 Conceptual Framework: Write a substantial explanation showing the relationship between variables, followed by a detailed editable sketch described in words.

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
- Write detailed, analytical paragraphs.
- Use APA 7th style in-text citations.
- Use plain text only, no markdown.

EXACT FORMAT REQUIRED:
CHAPTER TWO
2.0 INTRODUCTION
[short paragraph]
2.1.0 Empirical Review
[100 words with no citations]
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
Then write a short paragraph explaining what the chapter covers.

Required subsections with EXACT specifications and DEPTH requirements:
3.1 Research Approach: Write 1 clear paragraph (60 words)
3.2 Research Design: Write 1 clear paragraph (90 words), cite Creswell, justify the reason for choosing the design
3.3 Study Location: Write 1 clear paragraph (60 words)
3.4 Target Population: Write 1 clear paragraph (60 words, state the actual population)
3.5 Sample Size: Show using a formula how the sample was calculated, justify the reason for the sample size
3.6 Data Collection Instruments and Procedures: Write 1 clear paragraph (100 words, ensure to cite)
3.7 Data Analysis Plan: Write 1 clear paragraph (90 words, be clear, consistent, justify, cite)
3.8 Reliability and Validity: Write 1 clear paragraph (60 words)
3.9 Ethical Considerations: Write 1 clear paragraph (90 words)

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
- Write detailed, analytical paragraphs.
- Cite Creswell for research design.
- Use plain text only, no markdown.

EXACT FORMAT REQUIRED:
CHAPTER THREE
3.0 INTRODUCTION
[short paragraph]
3.1 Research Approach
[60 words]`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following sections with COMPLETE and DETAILED content.

REFERENCES
Provide a complete list of 30 references published in the last 10 years. Use credible verifiable sources, a mixture of books and journals. Include 4 research methods published books. All references must be in APA 7th edition format, alphabetised by author surname. Write out every reference in full with complete bibliographic details.

WORK PLAN
Present a detailed work plan showing specific activities across months (e.g., Month 1-2: Literature Review, Month 3: Proposal Writing, etc.). Include at least 6 months.

BUDGET
Present a detailed budget table showing items, quantities, unit costs, and total costs in Zambian Kwacha (ZMW). Include categories like stationery, data bundles, transport, assistant allowances, printing, equipment, software, and contingency.

APPENDICES
Write COMPLETE instruments with actual content. Follow these exact headings and ensure each is thorough:

APPENDIX A: STUDENT QUESTIONNAIRE

Write a full structured questionnaire with at least 5 sections and 20-25 actual questions with clear response options. Include:
Section A: Demographic Information (age, gender, year of study, faculty, residence)
Section B: Socioeconomic Status (monthly budget, source of funding, employment status, household income)
Section C: Information Resource Access (internet access, device ownership, library usage, frequency, barriers)
Section D: Academic Impact (perceived impact on grades, assignment completion, research quality)
Section E: Coping Strategies (strategies used to overcome access challenges)

Each question must have response options (e.g., Likert scale, multiple choice, yes/no). Write all questions out in full.

APPENDIX B: SEMI-STRUCTURED INTERVIEW GUIDE

Write a full interview guide with an introduction and at least 15-20 actual open-ended questions organized into sections:
- Introduction and consent statement
- Section 1: Background and Demographics (3-4 questions)
- Section 2: Information Access Challenges (4-5 questions)
- Section 3: Impact of Poverty on Academic Work (3-4 questions)
- Section 4: Coping Mechanisms and Support Systems (3-4 questions)
- Section 5: Recommendations (2-3 questions)
- Closing statement

APPENDIX C: INFORMED CONSENT FORM

Write a complete informed consent form with all required sections:
- Study Title
- Purpose of the Study
- Procedures
- Voluntary Participation and Withdrawal
- Confidentiality and Data Protection
- Risks and Benefits
- Contact Information
- Consent Statement with Participant's Name, Signature, and Date

APPENDIX D: INTRODUCTORY LETTER

Write a formal letter from the researcher to the university administration or relevant authorities requesting permission to collect data. Include: date, recipient details, subject, introduction, purpose, request for access, assurance of ethical conduct, and signature.

CRITICAL: All appendices must contain ACTUAL content, not descriptions. Write out all questions, response options, consent text, and letter content in full. Be comprehensive and detailed.`,
    },
  ];
}

// ============================================================
// RESEARCH PAPER SPECS (full dissertation structure)
// ============================================================
function buildResearchSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections, in this order, fully written out with substantial content:

DECLARATION
DEDICATION
ACKNOWLEDGEMENTS
ABSTRACT (with keywords)
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
Then write a short paragraph explaining what the chapter covers.

Required subsections:
1.1 Background of the Study
1.2 Statement of the Problem
1.3 Research Objectives (with 1.3.1 General Objective and 1.3.2 Specific Objectives)
1.4 Research Questions
1.5 Significance of the Study
1.6 Scope of Study
1.7 Operational Definitions

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
- Write detailed, analytical paragraphs.
- Use APA 7th style in-text citations.
- Use plain text only, no markdown.

EXACT FORMAT REQUIRED:
CHAPTER ONE
1.0 INTRODUCTION
[short paragraph]
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
Then write a short paragraph explaining what the chapter covers.

Required subsections:
2.1 Empirical Review
2.2 Theoretical Framework
2.3 Conceptual Framework

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
- Write detailed, analytical paragraphs.
- Use APA 7th style in-text citations.
- Use plain text only, no markdown.`,
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
Then write a short paragraph explaining what the chapter covers.

Required subsections:
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
- Each subsection must have SUBSTANTIAL content.
- Write detailed, analytical paragraphs.
- Cite Creswell for research design.
- Use plain text only, no markdown.`,
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
Then write a short paragraph explaining what the chapter covers.

Required subsections:
4.1 Descriptive and Demographic Results
4.2 Key Thematic or Statistical Findings
4.3 Summary of Findings

CRITICAL RULES:
- Present realistic findings with percentages and frequencies.
- Each subsection must have SUBSTANTIAL content.
- Use plain text only, no markdown.`,
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
Then write a short paragraph explaining what the chapter covers.

Required subsections:
5.1 Interpretation of Key Findings
5.2 Comparison with Previous Studies
5.3 Implications for Practice and Policy
5.4 Limitations of the Study

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
- Interpret findings from Chapter Four.
- Engage with literature from Chapter Two.
- Use plain text only, no markdown.`,
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
Then write a short paragraph explaining what the chapter covers.

Required subsections:
6.1 Conclusions
6.2 Recommendations

CRITICAL RULES:
- DO NOT include a 6.0 Introduction subsection.
- Each subsection must have SUBSTANTIAL content.
- Use plain text only, no markdown.

EXACT FORMAT REQUIRED:
CHAPTER SIX
6.0 CONCLUSIONS AND RECOMMENDATIONS
[short paragraph]
6.1 Conclusions
[4-5 substantial paragraphs]
6.2 Recommendations
[3-4 substantial paragraphs]`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES AND APPENDICES',
      chapterNumber: '',
      instructions: `Write ONLY the following with COMPLETE and DETAILED content.

REFERENCES
Provide a complete list of 30 references published in the last 10 years. Use a mixture of books and journals. Include 4 research methods books. All references must be in APA 7th edition format, alphabetised by author surname. Write out every reference in full with complete bibliographic details.

APPENDICES
Write COMPLETE and DETAILED appendices with actual content, not placeholders. Follow the exact heading format shown:

APPENDIX A: STUDENT QUESTIONNAIRE

Write a full structured questionnaire with at least 5 sections and 20-25 actual questions with clear response options. Include:
Section A: Demographic Information (age, gender, year of study, faculty, residence)
Section B: Socioeconomic Status (monthly budget, source of funding, employment status, household income)
Section C: Information Resource Access (internet access, device ownership, library usage, frequency, barriers)
Section D: Academic Impact (perceived impact on grades, assignment completion, research quality)
Section E: Coping Strategies (strategies used to overcome access challenges)

Each question must have response options (e.g., Likert scale, multiple choice, yes/no). Write all questions out in full.

APPENDIX B: SEMI-STRUCTURED INTERVIEW GUIDE

Write a full interview guide with an introduction and at least 15-20 actual open-ended questions organized into sections:
- Introduction and consent statement
- Section 1: Background and Demographics (3-4 questions)
- Section 2: Information Access Challenges (4-5 questions)
- Section 3: Impact of Poverty on Academic Work (3-4 questions)
- Section 4: Coping Mechanisms and Support Systems (3-4 questions)
- Section 5: Recommendations (2-3 questions)
- Closing statement

APPENDIX C: INFORMED CONSENT FORM

Write a complete informed consent form with all required sections:
- Study Title
- Purpose of the Study
- Procedures
- Voluntary Participation and Withdrawal
- Confidentiality and Data Protection
- Risks and Benefits
- Contact Information
- Consent Statement with Participant's Name, Signature, and Date

CRITICAL: All appendices must contain ACTUAL content, not descriptions. Write out all questions, response options, and consent text in full. Be comprehensive and detailed.`,
    },
  ];
}

// ============================================================
// DISPATCHER
// ============================================================
function buildChapterSpecs(topic: string, docType: string): ChapterSpec[] {
  if (docType === 'proposal') {
    return buildProposalSpecs(topic);
  }
  return buildResearchSpecs(topic);
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
// AI PROVIDER CALLS (Gemini, OpenRouter, Groq, You.com, Cerebras)
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

// ============================================================
// SECTION GENERATOR – tries providers in order
// ============================================================
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

// ============================================================
// CLEANUP
// ============================================================
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
// MAIN POST HANDLER
// ============================================================
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
- 1.1 Background: exactly 6 substantial paragraphs (each 6-8 sentences) with citations
- 1.2 Statement of Problem: approximately 100 words with citations
- 1.3 Research Objectives: include introductory sentence before listing
- 1.3.2 Specific Objectives: EXACTLY 3 objectives. DO NOT write 4 or more.
- 1.4 Research Questions: include introductory sentence before listing. EXACTLY 3 questions that match the 3 objectives.
- 1.6 Scope of Study: approximately 60 words
- 1.7 Operational Definitions: 5 terms with clear definitions

CRITICAL REMINDER:
- You MUST write EXACTLY 3 specific objectives.
- You MUST write EXACTLY 3 research questions.
- Each objective must correspond to one research question.
- DO NOT add extra objectives or questions.
- For 1.3 and 1.4, include the required introductory sentences.`;
      }

      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER TWO SPECIFICS:
- 2.1.0 Empirical Review: exactly 100 words, NO citations
- 2.1.1, 2.1.2, 2.1.3: Each 3-4 substantial paragraphs with citations
- 2.2 Theoretical Framework: 4-5 substantial paragraphs total
- 2.3 Conceptual Framework: Detailed explanation with variables`;
      }

      if (chapter.id === 'chapter3') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER THREE SPECIFICS:
- 3.1 Research Approach: exactly 60 words
- 3.2 Research Design: exactly 90 words, cite Creswell
- 3.3 Study Location: exactly 60 words
- 3.4 Target Population: exactly 60 words
- 3.5 Sample Size: Show formula and detailed justification
- 3.6 Data Collection: exactly 100 words, cite sources
- 3.7 Data Analysis: exactly 90 words, justify, cite
- 3.8 Reliability and Validity: exactly 60 words
- 3.9 Ethical Considerations: exactly 90 words`;
      }

      if (chapter.id === 'references') {
        chapterSpecificInstruction = `
PROPOSAL REFERENCES SPECIFICS:
- 30 complete APA 7th references
- 4 research methods books
- Work Plan with specific activities and timelines
- Budget table in Zambian Kwacha with realistic figures
- Appendix A: Student Questionnaire with 5 sections and 20-25 actual questions with response options
- Appendix B: Interview Guide with 15-20 actual open-ended questions
- Appendix C: Informed Consent Form with all required sections
- Appendix D: Introductory Letter
- All appendices must contain ACTUAL content, not descriptions.
- The questionnaire, interview guide, consent form, and letter must be comprehensive and detailed.`;
      }
    } else {
      // RESEARCH paper
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER ONE SPECIFICS:
- 1.1 Background: 6-8 substantial paragraphs with citations
- 1.2 Statement of Problem: 1 substantial paragraph
- 1.5 Significance: 2-3 substantial paragraphs
- 1.7 Operational Definitions: 5-8 terms with definitions`;
      }
      if (chapter.id === 'chapter6') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER SIX SPECIFICS:
- DO NOT include "6.0 Introduction" subsection
- 6.1 Conclusions: 4-5 substantial paragraphs
- 6.2 Recommendations: 3-4 substantial paragraphs grouped by stakeholder`;
      }
      if (chapter.id === 'references') {
        chapterSpecificInstruction = `
RESEARCH REFERENCES SPECIFICS:
- 30 complete APA 7th references
- 4 research methods books
- Appendix A: Student Questionnaire with 5 sections and 20-25 actual questions with response options
- Appendix B: Interview Guide with 15-20 actual open-ended questions
- Appendix C: Informed Consent Form with all required sections
- All appendices must contain ACTUAL content, not descriptions.`;
      }
    }

    // Build full prompt
    const prompt = `You are an expert academic writer producing a ${levelInfo.depth} ${typeLabel} for ${levelInfo.label}.

TOPIC: "${cleanTopic}"

${depthInstruction}

PREVIOUS CONTENT (for continuity):
${previousContext || 'This is the first section.'}

TASK: ${chapter.instructions}
${chapterSpecificInstruction}

CRITICAL RULES:
- This is a continuous academic document.
- Start with the chapter label exactly as specified.
- Write SUBSTANTIAL, DETAILED content - never brief or superficial.
- Use APA 7th style in-text citations throughout.
- Never use numbered bracket citations like [1].
- Use plain text only. No markdown, no asterisks, no underscores.
- Avoid the use of hyphens or dashes throughout.
- Write out full content. Never use placeholders.
- The document must demonstrate ${levelInfo.depth} academic writing.

For appendices: Write ACTUAL questions, response options, and consent text - not descriptions. Be comprehensive and detailed.`;

    // Token budget: references needs more room
    const chapterTokenBudget = chapter.id === 'references' ? 6000 : 3500;

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
