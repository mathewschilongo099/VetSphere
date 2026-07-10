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
    pageCount: '10-20 pages',
    depth: 'clear, practical, and moderately detailed',
  },
  degree: {
    label: "Bachelor's Degree Level",
    pageCount: '15-25 pages',
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
// ASSIGNMENT SPECS
// ============================================================
function buildAssignmentSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections for an ASSIGNMENT:

TITLE PAGE (with the assignment title, author name, course name, institution, date)

Do NOT write any chapter content yet. Stop after the title page.

CRITICAL: Use plain text only. No markdown, no asterisks.`,
    },
    {
      id: 'assignment',
      title: 'ASSIGNMENT CONTENT',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE ASSIGNMENT.

This is a STUDENT ASSIGNMENT - NOT a research paper.

STRUCTURE:
1.0 INTRODUCTION
[Write 2-3 paragraphs introducing the topic and explaining what the assignment covers]

2.0 MAIN BODY
[Write 4-6 substantial paragraphs covering the key points of the topic. Break into logical subsections with clear headings.]

3.0 CONCLUSION
[Write 1-2 paragraphs summarizing the key findings and conclusions]

4.0 REFERENCES
[Provide 8-15 credible references in APA 7th edition format]

CRITICAL RULES:
- This is an ASSIGNMENT - write in a clear, academic style suitable for coursework
- Focus on answering the question directly
- Use appropriate academic citations
- The structure should be straightforward and focused
- Use plain text only. No markdown.`,
    },
  ];
}

// ============================================================
// REPORT SPECS
// ============================================================
function buildReportSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections for a REPORT:

TITLE PAGE (with the report title, author name, organization, date)
EXECUTIVE SUMMARY (150-200 words summarizing the report)

Do NOT write any chapter content yet. Stop after the executive summary.

CRITICAL: Use plain text only. No markdown, no asterisks.`,
    },
    {
      id: 'report',
      title: 'REPORT CONTENT',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE REPORT.

This is a PROFESSIONAL REPORT - NOT a research paper.

STRUCTURE:
1.0 INTRODUCTION
[Write 2-3 paragraphs describing the purpose, scope, and background]

2.0 METHODOLOGY / APPROACH
[Write 2-3 paragraphs explaining how the information was gathered]

3.0 FINDINGS
[Write 3-5 paragraphs presenting the key findings with data and analysis]

4.0 RECOMMENDATIONS
[Write 2-3 paragraphs with specific actionable recommendations]

5.0 REFERENCES
[Provide 10-15 credible references in APA 7th edition format]

CRITICAL RULES:
- This is a REPORT - focus on findings and recommendations
- Use clear, concise language
- Include practical recommendations
- Use appropriate citations
- Use plain text only. No markdown.`,
    },
  ];
}

// ============================================================
// CASE STUDY SPECS
// ============================================================
function buildCaseStudySpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections for a CASE STUDY:

TITLE PAGE (with the case study title, author name, course name, institution, date)

Do NOT write any chapter content yet. Stop after the title page.

CRITICAL: Use plain text only. No markdown, no asterisks.`,
    },
    {
      id: 'casestudy',
      title: 'CASE STUDY CONTENT',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE CASE STUDY.

This is a CASE STUDY ANALYSIS - NOT a research paper.

STRUCTURE:
1.0 INTRODUCTION
[Write 2-3 paragraphs introducing the case and its significance]

2.0 CASE BACKGROUND
[Write 3-4 paragraphs describing the context, history, and relevant factors]

3.0 PROBLEM IDENTIFICATION
[Write 2-3 paragraphs identifying and analyzing the key problem(s)]

4.0 ANALYSIS
[Write 3-5 paragraphs applying relevant theories/frameworks to analyze the case]

5.0 SOLUTIONS / RECOMMENDATIONS
[Write 2-3 paragraphs proposing specific solutions with justification]

6.0 CONCLUSION
[Write 1-2 paragraphs summarizing key insights]

7.0 REFERENCES
[Provide 10-15 credible references in APA 7th edition format]

CRITICAL RULES:
- This is a CASE STUDY - focus on analysis of a specific situation
- Apply theoretical frameworks to analyze the case
- Provide practical solutions with justification
- Use appropriate citations
- Use plain text only. No markdown.`,
    },
  ];
}

// ============================================================
// RESEARCH PROPOSAL SPECS (existing)
// ============================================================
function buildProposalSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections for a RESEARCH PROPOSAL:

TITLE PAGE (with the research title, author name, degree, date)
TABLE OF CONTENTS (list all sections with page numbers as placeholders)
LIST OF ABBREVIATIONS AND ACRONYMS

Do NOT write any chapter content yet. Stop after the abbreviations list.

CRITICAL: Use plain text only. No markdown, no asterisks.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE Chapter One for a RESEARCH PROPOSAL.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER ONE
1.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers - this IS the introduction content, not a separate subsection]

1.1 Background of the Study
[Write 4-8 substantial paragraphs. Cover global, regional, and national context. Mention different countries as examples. Cite with references from the last 10 years.]

1.2 Statement of the Problem
[Write 1-2 paragraphs. Be convincing. Cite as evidence.]

1.3 Research Objectives
The following objectives guide this investigation:
1.3.1 General Objective
[One clear overarching objective]
1.3.2 Specific Objectives
[Write 3-5 specific objectives based on the topic's complexity]

1.4 Research Questions
To address the objectives, the study seeks to answer the following questions:
[Write 3-5 research questions that directly correspond to the objectives]

1.5 Significance of the Study
[Write 2-4 substantial paragraphs]

1.6 Scope of Study
[Write 1-2 paragraphs clearly defining boundaries]

1.7 Operational Definitions
[Define 5-8 key terms specific to this topic]

CRITICAL RULES:
- The heading "1.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- Use APA 7th style in-text citations throughout.
- Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PROPOSAL.

CHAPTER TWO
2.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers]

2.1.0 Empirical Review
[Write 100-150 words with NO citations]

2.1.1 [Theme from Objective 1]
[Write 3-5 substantial paragraphs presenting literature at global, regional, and national levels]

2.1.2 [Theme from Objective 2]
[Write 3-5 substantial paragraphs presenting literature at global, regional, and national levels]

2.1.3 [Theme from Objective 3]
[Write 3-5 substantial paragraphs presenting literature at global, regional, and national levels]

2.2 Theoretical Framework
[Write 4-6 substantial paragraphs using exactly 2 different theories]

2.3 Conceptual Framework
[Write a substantial explanation showing the relationship between variables]

CRITICAL RULES:
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PROPOSAL.

CHAPTER THREE
3.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers]

3.1 Research Approach
[Write 60-80 words]

3.2 Research Design
[Write 90-120 words, cite Creswell]

3.3 Study Location
[Write 60-80 words]

3.4 Target Population
[Write 60-80 words]

3.5 Sample Size
[Show using a formula how the sample was calculated]

3.6 Data Collection Instruments and Procedures
[Write 100-150 words, cite sources]

3.7 Data Analysis Plan
[Write 90-120 words, justify, cite]

3.8 Reliability and Validity
[Write 60-80 words]

3.9 Ethical Considerations
[Write 90-120 words]

CRITICAL RULES:
- Cite Creswell for research design.
- Use plain text only.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following sections:

REFERENCES
Provide 30 complete APA 7th references from the last 10 years. Mix books and journals. Include 4 research methods books.

WORK PLAN
Month 1-2: Literature Review and Proposal Development
Month 3: Instrument Development and Pilot Testing
Month 4-5: Data Collection
Month 6: Data Analysis
Month 7: Report Writing
Month 8: Revision and Submission

BUDGET
| Item | Quantity | Unit Cost (ZMW) | Total (ZMW) |
|------|----------|-----------------|-------------|
| Stationery and Printing | 1 set | 2,000 | 2,000 |
| Internet Data Bundles | 6 months | 500 | 3,000 |
| Research Assistant Allowance | 2 assistants | 3,000 | 6,000 |
| Transport and Logistics | 6 months | 1,500 | 9,000 |
| Questionnaire Printing | 400 copies | 2 | 800 |
| Equipment | 2 devices | 1,500 | 3,000 |
| Data Analysis Software | 1 license | 2,000 | 2,000 |
| Contingency Fund | 10% | | 2,580 |
| TOTAL | | | 28,380 |

APPENDICES
APPENDIX A: STUDENT QUESTIONNAIRE
APPENDIX B: SEMI-STRUCTURED INTERVIEW GUIDE
APPENDIX C: INFORMED CONSENT FORM
APPENDIX D: INTRODUCTORY LETTER`,
    },
  ];
}

// ============================================================
// RESEARCH PAPER SPECS (existing - full dissertation)
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
ABSTRACT (with keywords)
LIST OF ABBREVIATIONS AND ACRONYMS

Do NOT write a Table of Contents section. Do not guess page numbers.

CRITICAL: Use plain text only. No markdown, no asterisks.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE Chapter One for a RESEARCH PAPER.

CHAPTER ONE
1.0 Introduction
[Write a short paragraph explaining what the chapter covers]

1.1 Background of the Study
[Write 4-8 substantial paragraphs with citations covering global, regional, and national context]

1.2 Statement of the Problem
[Write 1-2 substantial paragraphs]

1.3 Research Objectives
[Write a short introductory sentence]
1.3.1 General Objective
[One clear overarching objective]
1.3.2 Specific Objectives
[Write 3-5 specific objectives]

1.4 Research Questions
[Write a short introductory sentence]
[Write 3-5 research questions]

1.5 Significance of the Study
[Write 2-4 substantial paragraphs]

1.6 Scope of Study
[Write 1-2 substantial paragraphs]

1.7 Operational Definitions
[Define 5-8 key terms]

CRITICAL RULES:
- The heading "1.0 Introduction" IS the introduction.
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PAPER.

CHAPTER TWO
2.0 Introduction
[Write a short paragraph explaining what the chapter covers]

2.1 Empirical Review
[Write substantial paragraphs with citations. Cover 3-5 themes derived from the objectives.]

2.2 Theoretical Framework
[Write 4-6 substantial paragraphs using exactly 2 different theories relevant to this topic]

2.3 Conceptual Framework
[Write a substantial explanation showing the relationship between variables]

CRITICAL RULES:
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PAPER.

CHAPTER THREE
3.0 Introduction
[Write a short paragraph explaining what the chapter covers]

3.1 Research Approach
[Write 1-2 clear paragraphs]

3.2 Research Design
[Write 1-2 clear paragraphs, cite Creswell]

3.3 Study Location
[Write 1-2 clear paragraphs]

3.4 Target Population
[Write 1-2 clear paragraphs]

3.5 Sample Size
[Show using a formula how the sample was calculated]

3.6 Data Collection Instruments and Procedures
[Write 1-2 clear paragraphs, cite sources]

3.7 Data Analysis Plan
[Write 1-2 clear paragraphs, justify, cite]

3.8 Reliability and Validity
[Write 1-2 clear paragraphs]

3.9 Ethical Considerations
[Write 1-2 clear paragraphs]

CRITICAL RULES:
- Cite Creswell for research design.
- Use plain text only.`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE Chapter Four for a RESEARCH PAPER.

CHAPTER FOUR
4.0 Introduction
[Write a short paragraph explaining what the chapter covers]

4.1 Descriptive and Demographic Results
[Write 3-5 paragraphs with realistic percentages and frequencies]

4.2 Key Thematic or Statistical Findings
[Write 4-6 paragraphs organized by the research objectives]

4.3 Summary of Findings
[Write 2-3 paragraphs]

CRITICAL RULES:
- Present realistic findings with percentages and frequencies.
- Use plain text only.`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a COMPREHENSIVE Chapter Five for a RESEARCH PAPER.

CHAPTER FIVE
5.0 Introduction
[Write a short paragraph explaining what the chapter covers]

5.1 Interpretation of Key Findings
[Write 4-6 substantial paragraphs]

5.2 Comparison with Previous Studies
[Write 4-6 substantial paragraphs engaging with literature from Chapter Two]

5.3 Implications for Practice and Policy
[Write 3-5 substantial paragraphs]

5.4 Limitations of the Study
[Write 2-4 substantial paragraphs]

CRITICAL RULES:
- Interpret findings from Chapter Four.
- Engage with literature from Chapter Two.
- Use plain text only.`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write a COMPREHENSIVE Chapter Six for a RESEARCH PAPER.

CHAPTER SIX
6.0 Introduction
[Write a short paragraph explaining what the chapter covers]

6.1 Conclusions
[Write 4-6 substantial paragraphs]

6.2 Recommendations
[Write 3-5 substantial paragraphs grouped by stakeholder]

CRITICAL RULES:
- Use plain text only.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following with COMPLETE content.

REFERENCES
Provide 30 complete APA 7th references from the last 10 years. Mix books and journals. Include 4 research methods books.

APPENDICES
APPENDIX A: DATA EXTRACTION TOOL
APPENDIX B: PARTICIPANT INFORMATION SHEET AND INFORMED CONSENT`,
    },
  ];
}

// ============================================================
// BUILD CHAPTER SPECS BASED ON TYPE
// ============================================================
function buildChapterSpecs(topic: string, docType: string): ChapterSpec[] {
  switch (docType) {
    case 'essay':
      return buildAssignmentSpecs(topic);
    case 'report':
      return buildReportSpecs(topic);
    case 'case-study':
      return buildCaseStudySpecs(topic);
    case 'proposal':
      return buildProposalSpecs(topic);
    case 'research':
    default:
      return buildResearchSpecs(topic);
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
// AI PROVIDER FUNCTIONS (KEEP YOUR EXISTING ONES)
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
        25000
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
            'HTTP-Referer': process.env.BASE_URL || 'http://localhost:3000',
            'X-Title': 'VetSphere Academic Writer',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.45,
            max_tokens: maxTokens,
          }),
        },
        25000
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
        25000
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
      25000
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
        25000
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
    error: `All providers failed: Groq (${groq.error}), OpenRouter (${openRouter.error}), Gemini (${gemini.error}), Cerebras (${cerebras.error}), You.com (${youCom.error})`,
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
// PPTX GENERATOR - Calls Python-pptx route
// ============================================================
async function generatePptxFromPaper(content: string, topic: string, level: string): Promise<{ buffer: Buffer; error: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/python-pptx`, {
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

    const cleanTopic = topic
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200F\uFEFF]/g, '')
      .trim();

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Research Paper';

    // Get the right specs based on document type
    const chapters = buildChapterSpecs(cleanTopic, type);
    
    // For assignment, report, case-study - they have fewer chapters
    const isSimpleType = ['essay', 'report', 'case-study'].includes(type);
    const totalChapters = isSimpleType ? 2 : (type === 'proposal' ? 5 : 8);
    
    const idx = Math.max(0, Math.min(chapterIndex, chapters.length - 1));
    const chapter = chapters[idx];

    let depthInstruction = `
CRITICAL DEPTH REQUIREMENT:
This is a ${levelInfo.label} academic document. The content must be COMPREHENSIVE and THOROUGH.
- Write SUBSTANTIAL paragraphs (minimum 5-7 sentences per paragraph for main content)
- Provide detailed analysis, not brief summaries
- Include specific examples, statistics, and evidence
- The document should reflect ${levelInfo.depth}
- Do not be brief or superficial - this is a serious academic work
`;

    let documentTypeInstruction = '';
    
    if (type === 'essay') {
      documentTypeInstruction = `
THIS IS AN ASSIGNMENT - NOT A RESEARCH PAPER.
- Structure: Introduction, Main Body, Conclusion, References
- Focus on answering the assignment question directly
- Use clear, academic language appropriate for coursework
- Include 8-15 references
- Do NOT include chapters or research paper structure
- The output should be a single, coherent document
- Length: ${levelInfo.pageCount}`;
    } else if (type === 'report') {
      documentTypeInstruction = `
THIS IS A REPORT - NOT A RESEARCH PAPER.
- Structure: Executive Summary, Introduction, Findings, Recommendations, References
- Focus on presenting findings and actionable recommendations
- Use clear, concise language
- Include practical recommendations
- Do NOT include chapters or research paper structure
- The output should be a single, coherent document
- Length: ${levelInfo.pageCount}`;
    } else if (type === 'case-study') {
      documentTypeInstruction = `
THIS IS A CASE STUDY - NOT A RESEARCH PAPER.
- Structure: Introduction, Case Background, Problem Identification, Analysis, Solutions, Conclusion, References
- Focus on analyzing a specific situation
- Apply theoretical frameworks to analyze the case
- Provide practical solutions with justification
- Do NOT include chapters or research paper structure
- The output should be a single, coherent document
- Length: ${levelInfo.pageCount}`;
    } else if (type === 'proposal') {
      documentTypeInstruction = `
THIS IS A RESEARCH PROPOSAL - A document proposing future research.
- Structure: Chapters 1-3 (Introduction, Literature Review, Methodology), References, Work Plan, Budget, Appendices
- Focus on proposing a research study
- Include detailed methodology
- The output should follow the proposal structure exactly
- Length: ${levelInfo.pageCount}`;
    } else {
      documentTypeInstruction = `
THIS IS A RESEARCH PAPER - A complete dissertation.
- Structure: Chapters 1-6 (Introduction, Literature Review, Methodology, Findings, Discussion, Conclusions), References, Appendices
- Focus on presenting original research
- Include detailed analysis and discussion
- The output should follow the research paper structure exactly
- Length: ${levelInfo.pageCount}`;
    }

    let chapterSpecificInstruction = '';

    if (type === 'proposal') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER ONE SPECIFICS:
- The heading "1.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- 1.1 Background: 4-8 substantial paragraphs
- 1.2 Statement of Problem: 1-2 paragraphs
- 1.3.2 Specific Objectives: 3-5 objectives
- 1.4 Research Questions: 3-5 questions
- 1.7 Operational Definitions: 5-8 terms`;
      }

      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER TWO SPECIFICS:
- 2.1.0 Empirical Review: 100-150 words, NO citations
- 2.1.1, 2.1.2, 2.1.3: Each 3-5 substantial paragraphs
- 2.2 Theoretical Framework: 4-6 substantial paragraphs`;
      }

      if (chapter.id === 'chapter3') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER THREE SPECIFICS:
- 3.1 Research Approach: 60-80 words
- 3.2 Research Design: 90-120 words, cite Creswell
- 3.5 Sample Size: Show formula
- 3.6 Data Collection: 100-150 words, cite sources
- 3.7 Data Analysis: 90-120 words, justify, cite`;
      }
    } else if (type === 'research') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER ONE SPECIFICS:
- 1.1 Background: 4-8 substantial paragraphs
- 1.3.2 Specific Objectives: 3-5 objectives
- 1.4 Research Questions: 3-5 questions
- 1.7 Operational Definitions: 5-8 terms`;
      }

      if (chapter.id === 'chapter6') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER SIX SPECIFICS:
- 6.1 Conclusions: 4-6 substantial paragraphs
- 6.2 Recommendations: 3-5 substantial paragraphs grouped by stakeholder`;
      }
    }

    const prompt = `You are an expert academic writer producing a ${levelInfo.depth} ${typeLabel} for ${levelInfo.label}.

TOPIC: "${cleanTopic}"

${documentTypeInstruction}

${depthInstruction}

PREVIOUS CONTENT (for continuity):
${previousContext || 'This is the first section.'}

TASK: ${chapter.instructions}
${chapterSpecificInstruction}

CRITICAL RULES:
- ${type === 'essay' ? 'This is an ASSIGNMENT - use assignment structure' : ''}
- ${type === 'report' ? 'This is a REPORT - use report structure' : ''}
- ${type === 'case-study' ? 'This is a CASE STUDY - use case study structure' : ''}
- ${type === 'proposal' ? 'This is a RESEARCH PROPOSAL - use proposal structure' : ''}
- ${type === 'research' ? 'This is a RESEARCH PAPER - use research paper structure' : ''}
- Start with the chapter label exactly as specified.
- The numbered introduction heading IS the introduction - do NOT add a separate subsection.
- Write SUBSTANTIAL, DETAILED content - never brief or superficial.
- Use APA 7th style in-text citations throughout.
- Never use numbered bracket citations like [1].
- Use plain text only. No markdown, no asterisks, no underscores.
- Avoid the use of hyphens or dashes throughout.
- Write out full content. Never use placeholders.
- The document must demonstrate ${levelInfo.depth} academic writing.`;

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
