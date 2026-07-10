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
// ASSIGNMENT SPECS - COMPLETE AND DETAILED
// ============================================================
function buildAssignmentSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'title',
      title: 'TITLE PAGE',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE TITLE PAGE for an ASSIGNMENT:

TITLE: Create a clear, descriptive title based on the topic
STUDENT NAME: [Student Name]
STUDENT ID: [Student ID]
COURSE NAME: [Course Name]
COURSE CODE: [Course Code]
INSTITUTION: [Institution Name]
DATE: [Current Date]

CRITICAL: Use plain text only. No markdown.`,
    },
    {
      id: 'introduction',
      title: '1.0 INTRODUCTION',
      chapterLabel: '',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE INTRODUCTION (10% of total length) for this ASSIGNMENT.

CONTENT REQUIREMENTS:
- Context and background to the topic
- Clear thesis statement or purpose (the argument you will make)
- Roadmap of what follows
- Explain why this topic is important
- Define key terms if needed

LENGTH: 3-4 substantial paragraphs (minimum 400-500 words)
FORMAT: Plain text only. No markdown.

CRITICAL: This is an ARGUMENT-DRIVEN assignment. The introduction should set up the argument you will develop.`,
    },
    {
      id: 'body',
      title: '2.0 MAIN BODY',
      chapterLabel: '',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE MAIN BODY (70-75% of total length) for this ASSIGNMENT.

CONTENT REQUIREMENTS:
- Organized by themes or sub-questions, NOT chronologically
- Each paragraph = ONE idea
- Topic sentence FIRST stating a claim (not just a subject)
- Evidence/citation to support each claim
- Analysis explaining the significance
- Link to next point
- Balance breadth vs depth - cover 3-5 points well
- Avoid pure description; always link facts back to the question

STRUCTURE:
2.1 [Theme/Sub-topic 1] - 3-4 paragraphs
2.2 [Theme/Sub-topic 2] - 3-4 paragraphs
2.3 [Theme/Sub-topic 3] - 3-4 paragraphs
(Add more sections if needed)

LENGTH: 8-12 substantial paragraphs (minimum 1500-2000 words)
FORMAT: Plain text only. No markdown.
CITATIONS: Use APA 7th style throughout.

CRITICAL RULES:
- Topic sentences must state a claim, not just a subject
- Example: "Antibiotic overuse in livestock accelerates resistance" NOT "This section discusses antibiotics"
- Always link facts back to the question
- Use appropriate academic citations`,
    },
    {
      id: 'conclusion',
      title: '3.0 CONCLUSION',
      chapterLabel: '',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE CONCLUSION (10-15% of total length) for this ASSIGNMENT.

CONTENT REQUIREMENTS:
- Synthesize the argument made in the body
- Answer the question posed in the introduction
- NO new information
- Tie back to the introduction
- May include implications or recommendations

LENGTH: 2-3 substantial paragraphs (minimum 300-400 words)
FORMAT: Plain text only. No markdown.

CRITICAL: Do NOT introduce new ideas or evidence in the conclusion.`,
    },
    {
      id: 'references',
      title: '4.0 REFERENCES',
      chapterLabel: '',
      chapterNumber: '4',
      instructions: `Write a COMPLETE REFERENCE LIST for this ASSIGNMENT.

REQUIREMENTS:
- 12-20 credible references in APA 7th edition format
- Alphabetical order by author surname
- Mix of books, journal articles, and credible online sources
- All references must be cited in the text above

FORMAT: APA 7th edition
CRITICAL: Write out every reference in full. No placeholders.`,
    },
  ];
}

// ============================================================
// CASE STUDY SPECS - COMPLETE AND DETAILED
// ============================================================
function buildCaseStudySpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'title',
      title: 'TITLE PAGE',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE TITLE PAGE for a CASE STUDY:

TITLE: Create a clear, descriptive case study title
AUTHOR NAME: [Author Name]
STUDENT ID: [Student ID]
COURSE NAME: [Course Name]
INSTITUTION: [Institution Name]
DATE: [Current Date]

CRITICAL: Use plain text only. No markdown.`,
    },
    {
      id: 'introduction',
      title: '1.0 INTRODUCTION',
      chapterLabel: '',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE INTRODUCTION (8-10% of total length) for this CASE STUDY.

CONTENT REQUIREMENTS:
- Why this case matters - significance and relevance
- Clear objective of the case study
- Brief overview of the case
- What the reader should learn

LENGTH: 3-4 substantial paragraphs (minimum 400-500 words)
FORMAT: Plain text only. No markdown.

CRITICAL: This section sets up the importance of the case study.`,
    },
    {
      id: 'presentation',
      title: '2.0 CASE PRESENTATION',
      chapterLabel: '',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE CASE PRESENTATION (15-20% of total length).

CRITICAL: FACTS ONLY - NO INTERPRETATION.

CONTENT REQUIREMENTS:
- Signalment (species, breed, age, sex, neuter status)
- History (presenting complaint, duration, previous treatments)
- Clinical examination findings (physical exam, vital signs)
- Diagnostics and test results (lab findings, imaging)
- Present all facts objectively

LENGTH: 4-6 substantial paragraphs (minimum 600-800 words)
FORMAT: Plain text only. No markdown.

CRITICAL RULES:
- DO NOT interpret findings here
- DO NOT discuss differentials here
- Present facts as facts
- Be detailed and specific`,
    },
    {
      id: 'discussion',
      title: '3.0 DISCUSSION / ANALYSIS',
      chapterLabel: '',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE DISCUSSION/ANALYSIS (35-40% of total length).

THIS IS THE CORE MARKED SECTION.

CONTENT REQUIREMENTS:
- Interpret the findings from Section 2.0
- Discuss differential diagnoses - rule in and rule out
- Compare to literature - reference relevant studies
- Justify every diagnosis with "why" (refer to literature)
- Explain treatment rationale (refer to literature)
- If case is atypical, explain the deviation explicitly

LENGTH: 8-12 substantial paragraphs (minimum 1200-1500 words)
FORMAT: Plain text only. No markdown.
CITATIONS: Use APA 7th style throughout.

CRITICAL RULES:
- Every diagnosis or treatment choice needs a "why"
- Justify against literature, not just state it
- Use real clinical terminology correctly`,
    },
    {
      id: 'management',
      title: '4.0 MANAGEMENT / OUTCOME',
      chapterLabel: '',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE MANAGEMENT/OUTCOME section (15-20% of total length).

CONTENT REQUIREMENTS:
- Treatment provided (specific details)
- Rationale for treatment (refer to literature)
- Prognosis - explain expected outcome
- Follow-up and actual outcome
- Any complications or challenges

LENGTH: 4-6 substantial paragraphs (minimum 500-700 words)
FORMAT: Plain text only. No markdown.
CITATIONS: Use APA 7th style where appropriate.`,
    },
    {
      id: 'conclusion',
      title: '5.0 CONCLUSION',
      chapterLabel: '',
      chapterNumber: '5',
      instructions: `Write a COMPREHENSIVE CONCLUSION (5-8% of total length) for this CASE STUDY.

CONTENT REQUIREMENTS:
- Summary of key points
- Tie back to the objective from Section 1.0
- What was learned from this case
- No new information

LENGTH: 2-3 substantial paragraphs (minimum 250-350 words)
FORMAT: Plain text only. No markdown.`,
    },
    {
      id: 'references',
      title: '6.0 REFERENCES',
      chapterLabel: '',
      chapterNumber: '6',
      instructions: `Write a COMPLETE REFERENCE LIST for this CASE STUDY.

REQUIREMENTS:
- 12-20 credible references in APA 7th edition format
- Mix of veterinary journals, textbooks, and clinical guidelines
- All references must be cited in the text above

FORMAT: APA 7th edition
CRITICAL: Write out every reference in full. No placeholders.`,
    },
    {
      id: 'appendices',
      title: '7.0 APPENDICES',
      chapterLabel: '',
      chapterNumber: '7',
      instructions: `Write a COMPLETE APPENDICES section for this CASE STUDY.

CONTENT REQUIREMENTS:
- Describe any raw data (lab results, test values)
- Describe any images (radiographs, ultrasound images)
- Describe any additional supporting documents
- Include relevant details that support the case

FORMAT: Plain text only. No markdown.`,
    },
  ];
}

// ============================================================
// REPORT SPECS - COMPLETE AND DETAILED
// ============================================================
function buildReportSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'title',
      title: 'TITLE PAGE',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE TITLE PAGE for a REPORT:

TITLE: Create a clear, descriptive report title
AUTHOR NAME: [Author Name]
ORGANIZATION: [Organization Name]
DATE: [Current Date]

CRITICAL: Use plain text only. No markdown.`,
    },
    {
      id: 'executive',
      title: 'EXECUTIVE SUMMARY',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE EXECUTIVE SUMMARY for this REPORT.

CONTENT REQUIREMENTS:
- One comprehensive paragraph
- Purpose of the report
- Method/approach
- Key findings
- Main recommendations

LENGTH: 150-200 words
FORMAT: Plain text only. No markdown.

CRITICAL: This is for decision-makers who skim. Be concise but comprehensive.`,
    },
    {
      id: 'introduction',
      title: '1.0 INTRODUCTION',
      chapterLabel: '',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE INTRODUCTION (10% of total length) for this REPORT.

CONTENT REQUIREMENTS:
- Background and context
- Purpose of the report
- Scope of the report
- Methodology (if applicable)

LENGTH: 3-4 substantial paragraphs (minimum 400-500 words)
FORMAT: Plain text only. No markdown.`,
    },
    {
      id: 'findings',
      title: '2.0 FINDINGS / RESULTS',
      chapterLabel: '',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE FINDINGS/RESULTS section (40-50% of total length).

CRITICAL: Present findings objectively and factually. NO INTERPRETATION.

CONTENT REQUIREMENTS:
- Organized under clear subheadings
- Use tables/figures where numeric data supports the point
- Present data logically
- Be neutral and factual

LENGTH: 6-10 substantial paragraphs (minimum 800-1200 words)
FORMAT: Plain text only. No markdown.

CRITICAL RULES:
- This section is NEUTRAL and FACTUAL
- Save opinion/interpretation for Discussion
- Use headings for skimmability`,
    },
    {
      id: 'discussion',
      title: '3.0 DISCUSSION',
      chapterLabel: '',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE DISCUSSION section (20-25% of total length) for this REPORT.

CONTENT REQUIREMENTS:
- What the findings mean
- Implications of the findings
- Limitations of the study/report

LENGTH: 4-6 substantial paragraphs (minimum 500-700 words)
FORMAT: Plain text only. No markdown.

CRITICAL: This is where you interpret the findings from Section 2.0.`,
    },
    {
      id: 'recommendations',
      title: '4.0 RECOMMENDATIONS',
      chapterLabel: '',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE RECOMMENDATIONS section (10-15% of total length).

CONTENT REQUIREMENTS:
- Specific, actionable recommendations
- Tied directly to findings
- Be specific (e.g., "Increase monitoring in Q3" not "Improve monitoring")

LENGTH: 3-4 substantial paragraphs (minimum 300-500 words)
FORMAT: Plain text only. No markdown.

CRITICAL: Recommendations must be SPECIFIC and ACTIONABLE.`,
    },
    {
      id: 'conclusion',
      title: '5.0 CONCLUSION',
      chapterLabel: '',
      chapterNumber: '5',
      instructions: `Write a BRIEF CONCLUSION (5% of total length) for this REPORT.

CONTENT REQUIREMENTS:
- Brief close
- No new information
- Tie back to purpose

LENGTH: 1-2 paragraphs (minimum 100-150 words)
FORMAT: Plain text only. No markdown.`,
    },
    {
      id: 'references',
      title: '6.0 REFERENCES',
      chapterLabel: '',
      chapterNumber: '6',
      instructions: `Write a COMPLETE REFERENCE LIST for this REPORT.

REQUIREMENTS:
- 12-20 credible references in APA 7th edition format
- All references must be cited in the text above

FORMAT: APA 7th edition`,
    },
    {
      id: 'appendices',
      title: '7.0 APPENDICES',
      chapterLabel: '',
      chapterNumber: '7',
      instructions: `Write a COMPLETE APPENDICES section for this REPORT.

CONTENT REQUIREMENTS:
- Describe any supporting documents
- Describe any raw data or detailed analysis
- Include any additional information

FORMAT: Plain text only. No markdown.`,
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

CHAPTER ONE
1.0 INTRODUCTION
[Short paragraph explaining what the chapter covers]

1.1 Background of the Study
[6-8 substantial paragraphs with citations]

1.2 Statement of the Problem
[2-3 substantial paragraphs]

1.3 Research Objectives
1.3.1 General Objective
1.3.2 Specific Objectives
[3-5 objectives]

1.4 Research Questions
[3-5 questions]

1.5 Significance of the Study
[3-4 paragraphs]

1.6 Scope of Study
[2 paragraphs]

1.7 Operational Definitions
[5-8 key terms]

CRITICAL: Use APA 7th style in-text citations. Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PROPOSAL.

CHAPTER TWO
2.0 INTRODUCTION
[Short paragraph]

2.1.0 Empirical Review
[150-200 words with NO citations]

2.1.1 [Theme from Objective 1]
[4-5 substantial paragraphs with citations]

2.1.2 [Theme from Objective 2]
[4-5 substantial paragraphs with citations]

2.1.3 [Theme from Objective 3]
[4-5 substantial paragraphs with citations]

2.2 Theoretical Framework
[5-6 paragraphs using 2 theories]

2.3 Conceptual Framework
[Detailed explanation with variables]

CRITICAL: Use APA 7th style in-text citations. Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PROPOSAL.

CHAPTER THREE
3.0 INTRODUCTION
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sample Size
3.6 Data Collection Instruments and Procedures
3.7 Data Analysis Plan
3.8 Reliability and Validity
3.9 Ethical Considerations

CRITICAL: Cite Creswell. Use plain text only.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following sections:

REFERENCES
Provide 30 complete APA 7th references.

WORK PLAN
Month 1-2: Literature Review
Month 3: Instrument Development
Month 4-5: Data Collection
Month 6: Data Analysis
Month 7: Report Writing
Month 8: Revision and Submission

BUDGET
| Item | Quantity | Unit Cost (ZMW) | Total (ZMW) |
|------|----------|-----------------|-------------|
| Stationery | 1 set | 2,000 | 2,000 |
| Internet Data | 6 months | 500 | 3,000 |
| Assistant Allowance | 2 assistants | 3,000 | 6,000 |
| Transport | 6 months | 1,500 | 9,000 |
| Printing | 400 copies | 2 | 800 |
| Equipment | 2 devices | 1,500 | 3,000 |
| Software | 1 license | 2,000 | 2,000 |
| Contingency | 10% | | 2,580 |
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
// RESEARCH PAPER SPECS (Full dissertation)
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

Do NOT write a Table of Contents section.

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
1.1 Background of the Study
1.2 Statement of the Problem
1.3 Research Objectives
1.3.1 General Objective
1.3.2 Specific Objectives
1.4 Research Questions
1.5 Significance of the Study
1.6 Scope of Study
1.7 Operational Definitions

CRITICAL: Use APA 7th style in-text citations. Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PAPER.

CHAPTER TWO
2.0 Introduction
2.1 Empirical Review
2.2 Theoretical Framework
2.3 Conceptual Framework

CRITICAL: Use APA 7th style in-text citations. Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PAPER.

CHAPTER THREE
3.0 Introduction
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sample Size
3.6 Data Collection Instruments and Procedures
3.7 Data Analysis Plan
3.8 Reliability and Validity
3.9 Ethical Considerations

CRITICAL: Cite Creswell. Use plain text only.`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE Chapter Four for a RESEARCH PAPER.

CHAPTER FOUR
4.0 Introduction
4.1 Descriptive and Demographic Results
4.2 Key Thematic or Statistical Findings
4.3 Summary of Findings`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a COMPREHENSIVE Chapter Five for a RESEARCH PAPER.

CHAPTER FIVE
5.0 Introduction
5.1 Interpretation of Key Findings
5.2 Comparison with Previous Studies
5.3 Implications for Practice and Policy
5.4 Limitations of the Study`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write a COMPREHENSIVE Chapter Six for a RESEARCH PAPER.

CHAPTER SIX
6.0 Introduction
6.1 Conclusions
6.2 Recommendations`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following:

REFERENCES
Provide 30 complete APA 7th references.

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

    const chapters = buildChapterSpecs(cleanTopic, type);
    
    const isSimpleType = ['essay', 'report', 'case-study'].includes(type);
    const totalChapters = isSimpleType ? 9 : (type === 'proposal' ? 5 : 8);
    
    const idx = Math.max(0, Math.min(chapterIndex, chapters.length - 1));
    const chapter = chapters[idx];

    let depthInstruction = `
CRITICAL DEPTH REQUIREMENT:
This is a ${levelInfo.label} academic document. The content must be COMPREHENSIVE and THOROUGH.
- Write SUBSTANTIAL paragraphs (minimum 5-7 sentences per paragraph)
- Provide detailed analysis, not brief summaries
- Include specific examples, statistics, and evidence
- The document should reflect ${levelInfo.depth}
- Do not be brief or superficial - this is a serious academic work
- The total length should be appropriate for the document type
`;

    let documentTypeInstruction = '';
    
    if (type === 'essay') {
      documentTypeInstruction = `
THIS IS AN ASSIGNMENT - NOT A RESEARCH PAPER.
You are answering a specific question or prompt. This is ARGUMENT-DRIVEN.

STRUCTURE (IN ORDER):
1. TITLE PAGE
2. 1.0 INTRODUCTION (10%) - Context, thesis, roadmap
3. 2.0 MAIN BODY (70-75%) - Organized by themes, NOT chronologically. Each paragraph = ONE idea. Topic sentence FIRST stating a claim. Evidence/citation. Analysis. Link to next point.
4. 3.0 CONCLUSION (10-15%) - Synthesize argument, answer the question, no new info
5. 4.0 REFERENCES - 12-20 APA 7th references

CRITICAL: Use topic sentences that state a claim, not just a subject. Avoid pure description; always link facts back to the question. Each section must be substantial (minimum 500+ words for introduction, 1500+ words for body, 300+ words for conclusion).

TOTAL LENGTH: ${levelInfo.pageCount}`;
    } else if (type === 'report') {
      documentTypeInstruction = `
THIS IS A REPORT - NOT A RESEARCH PAPER.
Write for decision-makers who skim.

STRUCTURE (IN ORDER):
1. TITLE PAGE
2. EXECUTIVE SUMMARY - One comprehensive paragraph: purpose, method, key findings, recommendations
3. 1.0 INTRODUCTION (10%) - Background, purpose, scope, methodology
4. 2.0 FINDINGS/RESULTS (40-50%) - Objective, factual, use headings, tables/figures. NO interpretation.
5. 3.0 DISCUSSION (20-25%) - What findings mean, implications, limitations
6. 4.0 RECOMMENDATIONS (10-15%) - Specific, actionable, tied to findings
7. 5.0 CONCLUSION (5%) - Brief close, no new info
8. 6.0 REFERENCES - 12-20 APA 7th references
9. APPENDICES

CRITICAL: Findings = neutral and factual. Recommendations must be specific ("Increase monitoring in Q3" not "Improve monitoring"). Use headings for skimmability.

TOTAL LENGTH: ${levelInfo.pageCount}`;
    } else if (type === 'case-study') {
      documentTypeInstruction = `
THIS IS A CASE STUDY - NOT A RESEARCH PAPER.
You are analyzing a specific case/patient/situation. This should be LONG and DETAILED like a research paper.

STRUCTURE (IN ORDER):
1. TITLE PAGE
2. 1.0 INTRODUCTION (8-10%) - Why this case matters, objective
3. 2.0 CASE PRESENTATION (15-20%) - FACTS ONLY: signalment, history, exam, diagnostics. NO interpretation. Be detailed.
4. 3.0 DISCUSSION/ANALYSIS (35-40%) - THIS IS THE CORE. Interpret findings, differential diagnoses, compare to literature. Justify every diagnosis/treatment with "why".
5. 4.0 MANAGEMENT/OUTCOME (15-20%) - Treatment, rationale, prognosis, follow-up
6. 5.0 CONCLUSION (5-8%) - Summary, tie back to objective, no new info
7. 6.0 REFERENCES - 12-20 APA 7th references
8. 7.0 APPENDICES - Raw data, images, lab reports

CRITICAL: STRICTLY separate description (Section 2.0) from interpretation (Section 3.0). Every diagnosis or treatment choice needs a "why" - justify against literature. This should be comprehensive and detailed.

TOTAL LENGTH: ${levelInfo.pageCount} (should be as long as a research paper)`;
    } else if (type === 'proposal') {
      documentTypeInstruction = `
THIS IS A RESEARCH PROPOSAL.
STRUCTURE (IN ORDER): CHAPTER ONE, CHAPTER TWO, CHAPTER THREE, REFERENCES, WORK PLAN, BUDGET, APPENDICES.

TOTAL LENGTH: ${levelInfo.pageCount}`;
    } else {
      documentTypeInstruction = `
THIS IS A RESEARCH PAPER (Full Dissertation).
STRUCTURE (IN ORDER): DECLARATION, DEDICATION, ACKNOWLEDGEMENTS, ABSTRACT, LIST OF ABBREVIATIONS, CHAPTER ONE, CHAPTER TWO, CHAPTER THREE, CHAPTER FOUR, CHAPTER FIVE, CHAPTER SIX, REFERENCES, APPENDICES.

TOTAL LENGTH: ${levelInfo.pageCount}`;
    }

    let chapterSpecificInstruction = '';

    if (type === 'proposal') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER ONE SPECIFICS:
- 1.1 Background: 6-8 substantial paragraphs
- 1.2 Statement of Problem: 2-3 substantial paragraphs
- 1.3.2 Specific Objectives: 3-5 objectives
- 1.4 Research Questions: 3-5 questions
- 1.7 Operational Definitions: 5-8 terms`;
      }

      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER TWO SPECIFICS:
- 2.1.0 Empirical Review: 150-200 words, NO citations
- 2.1.1, 2.1.2, 2.1.3: Each 4-5 substantial paragraphs
- 2.2 Theoretical Framework: 5-6 paragraphs`;
      }

      if (chapter.id === 'chapter3') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER THREE SPECIFICS:
- Each subsection should be 2-3 substantial paragraphs
- 3.2 Research Design: cite Creswell
- 3.5 Sample Size: Show formula
- 3.6 Data Collection: cite sources
- 3.7 Data Analysis: justify, cite`;
      }
    } else if (type === 'research') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER ONE SPECIFICS:
- 1.1 Background: 6-8 substantial paragraphs
- 1.2 Statement of Problem: 2-3 substantial paragraphs
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
- This is a ${typeLabel} - follow the structure for ${type}.
- Start with the section heading exactly as specified.
- Write SUBSTANTIAL, DETAILED content - never brief or superficial.
- Use APA 7th style in-text citations throughout.
- Never use numbered bracket citations like [1].
- Use plain text only. No markdown, no asterisks, no underscores.
- Avoid the use of hyphens or dashes throughout.
- Write out full content. Never use placeholders.
- The document must demonstrate ${levelInfo.depth} academic writing.
- For assignments, case studies, and reports: WRITE SUBSTANTIAL CONTENT. 1500+ words minimum.`;

    const chapterTokenBudget = chapter.id === 'references' ? 6000 : 4000;

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
      chapter.id === 'frontmatter' || chapter.id === 'chapter1' || chapter.id === 'title'
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
