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
// BUILD PROPOSAL SPECS - ADAPTABLE STRUCTURE
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
[Write 4-8 substantial paragraphs. The number depends on the topic complexity. Each paragraph 5-7 sentences. Cover global, regional, and national context. Mention different countries as examples. Cite with references from the last 10 years. ADAPT the content to the SPECIFIC topic - do not use generic text.]

1.2 Statement of the Problem
[Write 1-2 paragraphs. Be convincing. Cite as evidence. Clearly articulate the research gap SPECIFIC to this topic.]

1.3 Research Objectives
The following objectives guide this investigation:
1.3.1 General Objective
[One clear overarching objective]
1.3.2 Specific Objectives
[Write 3-5 specific objectives based on the topic's complexity and scope. Each must be specific and measurable.]

1.4 Research Questions
To address the objectives, the study seeks to answer the following questions:
[Write 3-5 research questions that directly correspond to the objectives above.]

1.5 Significance of the Study
[Write 2-4 substantial paragraphs explaining significance to different stakeholders. Adapt to the specific topic.]

1.6 Scope of Study
[Write 1-2 paragraphs clearly defining boundaries. Adapt to the specific topic's geographical, temporal, and population scope.]

1.7 Operational Definitions
[Define 5-8 key terms specific to this topic with 2-3 sentences each.]

CRITICAL RULES:
- The heading "1.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- WRITE UNIQUELY FOR EACH TOPIC. Do not use generic, reusable text.
- The number of objectives and questions should be 3-5, not always exactly 3.
- The number of Background paragraphs should be 4-8, not always exactly 6.
- Each subsection must have SUBSTANTIAL, TOPIC-SPECIFIC content.
- Use APA 7th style in-text citations throughout.
- Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PROPOSAL.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER TWO
2.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers - this IS the introduction content, not a separate subsection]

2.1.0 Empirical Review
[Write 100-150 words with NO citations - a synthesis of the research landscape specific to this topic.]

2.1.1 [Theme from Objective 1]
[Write 3-5 substantial paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize. TAILOR to the specific topic.]

2.1.2 [Theme from Objective 2]
[Write 3-5 substantial paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize. TAILOR to the specific topic.]

2.1.3 [Theme from Objective 3]
[Write 3-5 substantial paragraphs presenting literature at global, regional, and national levels. Cite in standard APA style. Move beyond description - critically analyze, compare, and synthesize. TAILOR to the specific topic.]

2.2 Theoretical Framework
[Write 4-6 substantial paragraphs using exactly 2 different theories that are RELEVANT to this specific topic. State the theory, by whom, when, what the theory is about, and how the theory is linked to the current study.]

2.3 Conceptual Framework
[Write a substantial explanation showing the relationship between variables, followed by a description of the conceptual framework sketch. ADAPT to the specific topic's variables.]

CRITICAL RULES:
- The heading "2.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- Each subsection must have SUBSTANTIAL, TOPIC-SPECIFIC content.
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PROPOSAL.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER THREE
3.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers - this IS the introduction content, not a separate subsection]

3.1 Research Approach
[Write 60-80 words clearly explaining the approach and its justification.]

3.2 Research Design
[Write 90-120 words clearly explaining the design, cite Creswell, justify the reason for choosing the design.]

3.3 Study Location
[Write 60-80 words describing the location and its relevance to this specific study.]

3.4 Target Population
[Write 60-80 words stating the actual population and its characteristics specific to this study.]

3.5 Sample Size
[Show using a formula how the sample was calculated, justify the reason for the sample size with detailed explanation.]

3.6 Data Collection Instruments and Procedures
[Write 100-150 words describing instruments and procedures, ensure to cite.]

3.7 Data Analysis Plan
[Write 90-120 words clearly explaining the plan, be consistent, justify, cite.]

3.8 Reliability and Validity
[Write 60-80 words explaining measures taken specific to this study.]

3.9 Ethical Considerations
[Write 90-120 words clearly explaining ethical protocols specific to this study.]

CRITICAL RULES:
- The heading "3.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- Each subsection must have SUBSTANTIAL, TOPIC-SPECIFIC content.
- Cite Creswell for research design.
- Use plain text only.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following sections with COMPLETE content.

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
| Equipment (Recording Devices) | 2 devices | 1,500 | 3,000 |
| Data Analysis Software | 1 license | 2,000 | 2,000 |
| Contingency Fund | 10% | | 2,580 |
| TOTAL | | | 28,380 |

APPENDICES - Write COMPLETE instruments with ACTUAL content:

APPENDIX A: STUDENT QUESTIONNAIRE
Write a full questionnaire with at least 5 sections and 20-25 actual questions with response options.

APPENDIX B: SEMI-STRUCTURED INTERVIEW GUIDE
Write a full interview guide with 15-20 actual open-ended questions.

APPENDIX C: INFORMED CONSENT FORM
Write a complete informed consent form with all required sections.

APPENDIX D: INTRODUCTORY LETTER
Write a formal letter requesting permission to collect data.

CRITICAL: All appendices must contain ACTUAL content, not descriptions.`,
    },
  ];
}

// ============================================================
// BUILD RESEARCH SPECS - ADAPTABLE STRUCTURE
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
      instructions: `Write a COMPREHENSIVE Chapter One.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER ONE
1.0 Introduction
[Write a short paragraph explaining what the chapter covers - this IS the introduction content]

1.1 Background of the Study
[Write 4-8 substantial paragraphs. Adapt to the topic complexity. Cover global, regional, and national context. Cite with references from the last 10 years. Make it UNIQUE to this specific topic.]

1.2 Statement of the Problem
[Write 1-2 substantial paragraphs. Adapt to the specific topic.]

1.3 Research Objectives
[Write a short introductory sentence]
1.3.1 General Objective
[One clear overarching objective]
1.3.2 Specific Objectives
[Write 3-5 specific objectives based on the topic]

1.4 Research Questions
[Write a short introductory sentence]
[Write 3-5 research questions corresponding to the objectives]

1.5 Significance of the Study
[Write 2-4 substantial paragraphs adapted to the topic]

1.6 Scope of Study
[Write 1-2 substantial paragraphs adapted to the topic]

1.7 Operational Definitions
[Define 5-8 key terms specific to this topic]

CRITICAL RULES:
- The heading "1.0 Introduction" IS the introduction - do not add a separate subsection.
- WRITE UNIQUELY FOR EACH TOPIC. Do not use generic, reusable text.
- Objectives and questions should be 3-5, not always exactly 3.
- Background paragraphs should be 4-8, not always exactly 6.
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER TWO
2.0 Introduction
[Write a short paragraph explaining what the chapter covers - this IS the introduction content]

2.1 Empirical Review
[Write substantial paragraphs with citations. Adapt themes to this specific topic. Cover 3-5 themes derived from the objectives.]

2.2 Theoretical Framework
[Write 4-6 substantial paragraphs using exactly 2 different theories relevant to this topic]

2.3 Conceptual Framework
[Write a substantial explanation showing the relationship between variables specific to this study]

CRITICAL RULES:
- The heading "2.0 Introduction" IS the introduction - do not add a separate subsection.
- Each subsection must have SUBSTANTIAL, TOPIC-SPECIFIC content.
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER THREE
3.0 Introduction
[Write a short paragraph explaining what the chapter covers - this IS the introduction content]

3.1 Research Approach
[Write 1-2 clear paragraphs adapted to the topic]

3.2 Research Design
[Write 1-2 clear paragraphs, cite Creswell, justify the design choice]

3.3 Study Location
[Write 1-2 clear paragraphs specific to this study]

3.4 Target Population
[Write 1-2 clear paragraphs, state the actual population]

3.5 Sample Size
[Show using a formula how the sample was calculated, justify the sample size]

3.6 Data Collection Instruments and Procedures
[Write 1-2 clear paragraphs, ensure to cite]

3.7 Data Analysis Plan
[Write 1-2 clear paragraphs, be consistent, justify, cite]

3.8 Reliability and Validity
[Write 1-2 clear paragraphs]

3.9 Ethical Considerations
[Write 1-2 clear paragraphs]

CRITICAL RULES:
- The heading "3.0 Introduction" IS the introduction - do not add a separate subsection.
- Cite Creswell for research design.
- Use plain text only.`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE Chapter Four.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER FOUR
4.0 Introduction
[Write a short paragraph explaining what the chapter covers - this IS the introduction content]

4.1 Descriptive and Demographic Results
[Write 3-5 paragraphs with realistic percentages and frequencies]

4.2 Key Thematic or Statistical Findings
[Write 4-6 paragraphs organized by the research objectives]

4.3 Summary of Findings
[Write 2-3 paragraphs]

CRITICAL RULES:
- The heading "4.0 Introduction" IS the introduction - do not add a separate subsection.
- Present realistic findings with percentages and frequencies.
- Use plain text only.`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a COMPREHENSIVE Chapter Five.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER FIVE
5.0 Introduction
[Write a short paragraph explaining what the chapter covers - this IS the introduction content]

5.1 Interpretation of Key Findings
[Write 4-6 substantial paragraphs]

5.2 Comparison with Previous Studies
[Write 4-6 substantial paragraphs engaging with literature from Chapter Two]

5.3 Implications for Practice and Policy
[Write 3-5 substantial paragraphs]

5.4 Limitations of the Study
[Write 2-4 substantial paragraphs]

CRITICAL RULES:
- The heading "5.0 Introduction" IS the introduction - do not add a separate subsection.
- Interpret findings from Chapter Four.
- Engage with literature from Chapter Two.
- Use plain text only.`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write a COMPREHENSIVE Chapter Six.

CRITICAL - FOLLOW THIS EXACT FORMAT. Start DIRECTLY with the numbered heading:

CHAPTER SIX
6.0 Introduction
[Write a short paragraph explaining what the chapter covers - this IS the introduction content]

6.1 Conclusions
[Write 4-6 substantial paragraphs]

6.2 Recommendations
[Write 3-5 substantial paragraphs grouped by stakeholder]

CRITICAL RULES:
- The heading "6.0 Introduction" IS the introduction - do not add a separate subsection.
- Each subsection must have SUBSTANTIAL content.
- Use plain text only.`,
    },
    {
      id: 'references',
      title: 'REFERENCES AND APPENDICES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following with COMPLETE and DETAILED content.

REFERENCES
Provide 30 complete APA 7th references from the last 10 years. Mix books and journals. Include 4 research methods books.

APPENDICES
Write COMPLETE instruments with ACTUAL content:

APPENDIX A: DATA EXTRACTION TOOL
Write a complete data extraction tool with sections and variables.

APPENDIX B: PARTICIPANT INFORMATION SHEET AND INFORMED CONSENT
Write a complete information sheet and consent form with Part I and Part II.

CRITICAL: All appendices must contain ACTUAL content, not descriptions.`,
    },
  ];
}

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
- The document should reflect ${levelInfo.depth}
- Do not be brief or superficial - this is a serious academic work
`;

    let chapterSpecificInstruction = '';

    if (type === 'proposal') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER ONE SPECIFICS:
- The heading "1.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- 1.1 Background: 4-8 substantial paragraphs (adapt to topic complexity)
- 1.2 Statement of Problem: 1-2 paragraphs
- 1.3.2 Specific Objectives: 3-5 objectives (based on topic scope)
- 1.4 Research Questions: 3-5 questions matching objectives
- 1.7 Operational Definitions: 5-8 terms
- WRITE UNIQUELY FOR THIS SPECIFIC TOPIC.`;
      }

      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER TWO SPECIFICS:
- The heading "2.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- 2.1.0 Empirical Review: 100-150 words, NO citations
- 2.1.1, 2.1.2, 2.1.3: Each 3-5 substantial paragraphs
- 2.2 Theoretical Framework: 4-6 substantial paragraphs
- WRITE UNIQUELY FOR THIS SPECIFIC TOPIC.`;
      }

      if (chapter.id === 'chapter3') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER THREE SPECIFICS:
- The heading "3.0 INTRODUCTION" IS the introduction - do not add a separate subsection.
- 3.1 Research Approach: 60-80 words
- 3.2 Research Design: 90-120 words, cite Creswell
- 3.3 Study Location: 60-80 words
- 3.4 Target Population: 60-80 words
- 3.6 Data Collection: 100-150 words, cite sources
- 3.7 Data Analysis: 90-120 words, justify, cite
- 3.9 Ethical Considerations: 90-120 words`;
      }

      if (chapter.id === 'references') {
        chapterSpecificInstruction = `
PROPOSAL REFERENCES SPECIFICS:
- 30 complete APA 7th references
- 4 research methods books
- Work Plan with activities and timelines
- Budget table in Zambian Kwacha
- Appendix A: Student Questionnaire with 5 sections and 20-25 actual questions
- Appendix B: Interview Guide with 15-20 actual open-ended questions
- Appendix C: Informed Consent Form with all required sections
- Appendix D: Introductory Letter`;
      }
    } else {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER ONE SPECIFICS:
- The heading "1.0 Introduction" IS the introduction - do not add a separate subsection.
- 1.1 Background: 4-8 substantial paragraphs (adapt to topic)
- 1.3.2 Specific Objectives: 3-5 objectives
- 1.4 Research Questions: 3-5 questions
- 1.7 Operational Definitions: 5-8 terms
- WRITE UNIQUELY FOR THIS SPECIFIC TOPIC.`;
      }

      if (chapter.id === 'chapter6') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER SIX SPECIFICS:
- The heading "6.0 Introduction" IS the introduction - do not add a separate subsection.
- 6.1 Conclusions: 4-6 substantial paragraphs
- 6.2 Recommendations: 3-5 substantial paragraphs grouped by stakeholder`;
      }

      if (chapter.id === 'references') {
        chapterSpecificInstruction = `
RESEARCH REFERENCES SPECIFICS:
- 30 complete APA 7th references
- 4 research methods books
- Appendix A: Data Extraction Tool with actual variables
- Appendix B: Participant Information Sheet and Informed Consent with actual content`;
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
- This is a continuous academic document.
- Start with the chapter label exactly as specified (e.g., "CHAPTER ONE").
- The numbered introduction heading (e.g., "1.0 Introduction") IS the introduction - do NOT add a separate subsection called "Introduction" underneath it.
- WRITE UNIQUELY FOR EACH TOPIC. Do not use generic, reusable text that could be copied between papers.
- Each paper should look and feel different based on the topic.
- The number of objectives and questions should vary between 3-5 depending on the topic.
- The number of paragraphs in each section should vary based on topic complexity.
- Use APA 7th style in-text citations throughout.
- Never use numbered bracket citations like [1].
- Use plain text only. No markdown, no asterisks, no underscores.
- Avoid the use of hyphens or dashes throughout.
- Write out full content. Never use placeholders.
- The document must demonstrate ${levelInfo.depth} academic writing.

For appendices: Write ACTUAL questions, response options, and consent text - not descriptions. Be comprehensive and detailed.`;

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
