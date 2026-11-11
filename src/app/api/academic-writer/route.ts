// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

// Optional. When set, it is sent to OpenAlex and Crossref so requests use their polite pools.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || '';

const MAX_TAIL_CHARS = 2500;
const YEARS_BACK = 10;
const MAX_POOL = 42;
const PROMPT_SOURCE_LIMIT = 24;
const STATE_OPEN = '<<STATE>>';
const STATE_CLOSE = '<<END>>';

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

// ============================================================
// TYPES
// ============================================================
interface ChapterSpec {
  id: string;
  title: string;
  chapterLabel: string;
  chapterNumber: string;
  instructions: string;
  backMatter?: string;
}

// A verified source. Short keys keep the state small because it travels through the client.
interface Source {
  i: string; // id
  r: string; // full APA 7th reference
  p: string; // parenthetical citation text, for example "Smith et al., 2021"
  n: string; // narrative citation, for example "Smith et al. (2021)"
  s: string; // short summary taken from the abstract
  d: string; // lowercase DOI used for de duplication
  u?: boolean; // already cited somewhere in the document
  b?: boolean; // research methods book
}

interface Brief {
  general: string;
  objectives: string[];
  questions: string[];
  abbreviations: string;
}

interface DocState {
  brief: Brief;
  sources: Source[];
}

interface RawWork {
  authors: { family: string; given: string }[];
  year: number;
  title: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  abstract: string;
}

// ============================================================
// SHARED INSTRUCTION BLOCKS (no topic specific examples anywhere)
// ============================================================
const NO_META_COMMENTARY = `
Output ONLY the requested document text. No introductions, no remarks to the reader, no closing notes.
`;

const SOURCE_RULES = `
SOURCE RULES (non negotiable, they protect the truthfulness of the document):
1. You may cite ONLY the works listed under VERIFIED SOURCES. Use the exact CITE AS text inside brackets and the NARRATIVE form inside sentences. Never print the S numbers.
2. Never invent or recall from memory any author, year, title, journal, DOI, law, policy, report, organisation publication or statistic. If a point is not supported by a listed source, write it in general terms without a citation.
3. State a number, percentage or finding only if it appears in the SUMMARY of the source you cite, and attach it to that source.
4. Every citation must agree with that source's SUMMARY. Do not stretch a source beyond its summary and do not cite a source only to decorate a sentence.
5. Use many different sources, and do not cite one source more than twice in a single section. Join several sources for one claim as (Author, Year; Author, Year) in alphabetical order.
6. Never write a reference list. The reference list is generated automatically from the sources you cite.
7. In sections where citations are not allowed, write no citations at all.
`;

const COMMON_STYLE = `
WRITING STYLE:
- Plain text only. No markdown symbols (no asterisks, hash signs, backticks or pipes), no bullet symbols, no tables.
- Print headings exactly as specified, each on its own line, followed by a blank line.
- Formal, precise academic English in the third person. No filler, no repetition, no rhetorical questions.
- Every sentence must come from this topic. Never reuse wording, names, places, institutions or examples that appear in these instructions.
- No placeholders such as [insert], XXX or TBA.
- Use only the abbreviations permitted in the brief. Write every other term in full. When a permitted abbreviation first appears, give the full term first and the abbreviation in brackets.
`;

const PROPOSAL_STYLE = `
PROPOSAL STYLE (strict):
- Do not use hyphens or dashes anywhere in the prose: no em dashes, no en dashes, no spaced hyphens. Rephrase with commas, colons, full stops or the words "to", "and" and "minus". Avoid hyphenated compounds by rewording them.
- Use the future tense for what the study will do and the past tense for what earlier literature reported.
- Word limits are firm. Stay within 10 percent of every stated word count.
`;

const OBJECTIVE_RULES = `
OBJECTIVE AND QUESTION RULES:
- General objective: one clear sentence of 20 to 25 words that begins with "To".
- Specific objectives: exactly 3, numbered 1 to 3, each beginning "To" plus an action verb, each measurable, and together they must achieve the general objective.
- Research questions: exactly 3, numbered 1 to 3. Each one is the question form of the objective with the same number.
- Draw every objective and question from this topic only.
`;

const ABBREVIATION_RULE = `
ABBREVIATIONS:
- List only abbreviations that this paper will really use. Take them from the topic itself and from the standard terms of its field and methods.
- Between 3 and 8 entries, in alphabetical order, one per line in the form ABBREVIATION: Full form.
- Name an institution or a place only if the topic itself names it.
- If the paper needs none, write: None required.
`;

function citationRules(type: string): string {
  if (type === 'proposal') {
    return `
CITATION RULES (APA 7th, author and date):
- Citations are allowed in 1.1, 1.2, 1.5, 1.6, 1.7, 2.1.1, 2.1.2, 2.1.3, 2.2 and 3.1 to 3.9.
- No citations in 1.0, 1.3, 1.4, 2.0, 2.1.0 and 2.3.`;
  }
  if (type === 'research') {
    return `
CITATION RULES (APA 7th, author and date):
- Citations are allowed in the background, problem statement, significance, scope, operational definitions, literature review (except 2.0 and 2.3), methodology and discussion.
- No citations in 1.0, the objectives, the research questions, 2.0, 2.3, Chapter Four, 5.0, 5.4 and Chapter Six.`;
  }
  return `
CITATION RULES (APA 7th, author and date):
- Cite verified sources in the body of the document. Do not cite in the title page.`;
}

// ============================================================
// CHAPTER SPECS
// ============================================================
function frontMatterTask(type: string): string {
  if (type === 'proposal') {
    return `Write ONLY this section:

LIST OF ABBREVIATIONS AND ACRONYMS
${ABBREVIATION_RULE}
${NO_META_COMMENTARY}`;
  }
  return `Write ONLY the following front matter sections, in this order:

DECLARATION
A short, formal declaration of originality (3 to 4 sentences).

DEDICATION
One short line.

ACKNOWLEDGEMENTS
One short paragraph thanking supervisors, participants and institutions in general terms, without inventing names.

ABSTRACT
200 to 250 words covering the background, problem, objectives, methods and significance, followed by a line "Keywords:" with 4 to 6 keywords.

LIST OF ABBREVIATIONS AND ACRONYMS
${ABBREVIATION_RULE}
${NO_META_COMMENTARY}`;
}

function chapter1Spec(type: string): ChapterSpec {
  const proposal = type === 'proposal';
  return {
    id: 'chapter1',
    title: 'CHAPTER ONE: INTRODUCTION',
    chapterLabel: 'CHAPTER ONE',
    chapterNumber: '1',
    instructions: `Write CHAPTER ONE exactly in this order. Print every heading exactly as shown.

${citationRules(type)}
${OBJECTIVE_RULES}

CHAPTER ONE

1.0 Introduction
One short paragraph (about 50 words) that explains what this chapter covers. No citations.

1.1 Background of the Study
Exactly 6 paragraphs of 5 to 7 sentences each, moving from the global position to the regional and then the national position:
Paragraph 1: the global overview of the subject, with evidence from at least two different countries.
Paragraph 2: global trends, drivers and consequences, with examples from other countries.
Paragraph 3: the regional situation (identify the region from the topic), with examples from at least two countries in that region.
Paragraph 4: regional responses, policies and practices, and the gaps that remain.
Paragraph 5: the national situation in the country of the study. Infer the country from the topic. If the topic names no country, discuss the national context implied by the setting and say plainly that it is inferred.
Paragraph 6: the local or institutional situation and the gap that justifies this study.
Cite at least 10 different verified sources across these paragraphs, and name the countries each source covers.

1.2 Statement of the Problem
${
  proposal
    ? 'ONE convincing paragraph of 95 to 105 words. Name the problem, who is affected, the evidence of its magnitude, the consequence of inaction and the gap in knowledge. Cite evidence.'
    : 'Two to three convincing paragraphs. Name the problem, who is affected, the evidence of its magnitude, the consequence of inaction and the gap in knowledge. Cite evidence.'
}

1.3 Research Objectives

1.3.1 General Objective
One sentence of 20 to 25 words.

1.3.2 Specific Objectives
Exactly 3 numbered objectives.

1.4 Research Questions
Exactly 3 numbered questions, one for each objective.

1.5 Significance of the Study
Three short paragraphs: the contribution to knowledge, the contribution to policy and practice, and the benefit to the community or stakeholders.

1.6 Scope of Study
About 60 words covering the setting, the population, the time frame and the variables.

1.7 Operational Definitions
Exactly 5 key terms from this topic, each on its own line in the form "Term: definition as used in this study" (one or two sentences).

${NO_META_COMMENTARY}`,
  };
}

function chapter2Spec(type: string): ChapterSpec {
  return {
    id: 'chapter2',
    title: 'CHAPTER TWO: LITERATURE REVIEW',
    chapterLabel: 'CHAPTER TWO',
    chapterNumber: '2',
    instructions: `Write CHAPTER TWO exactly in this order. Print every heading exactly as shown.

${citationRules(type)}

CHAPTER TWO

2.0 Introduction
One short paragraph (about 50 words) explaining what this chapter covers. No citations.

2.1.0 Empirical Review
One paragraph of about 100 words that introduces how the empirical literature is organised around the three objectives. No citations.

2.1.1 [Write a theme title taken from specific objective 1]
2.1.2 [Write a theme title taken from specific objective 2]
2.1.3 [Write a theme title taken from specific objective 3]
Replace each bracketed instruction with a real theme title. Under each theme write 3 to 4 paragraphs that present the literature at the global, regional and national or local levels. Move beyond description: compare and contrast findings, explain why results differ (design, population, measurement, context), point out inconsistencies, weaknesses and gaps, and end each theme by stating how the gap links to this study. Use the objectives in the DOCUMENT BRIEF. Cite with the standard author and date form, using verified sources only.

2.2 Theoretical Framework
Use exactly 2 different theories that suit this topic and discipline. For each theory state its name, its proponent or proponents and the year it originated (written in running text, which is an origin statement and not a formal citation), what the theory explains (its main propositions), and how it links to the variables and objectives of this study. A maximum of 3 paragraphs for the whole section. Support the explanation with a verified source that applies or reviews the theory where one exists.

2.3 Conceptual Framework
One short paragraph (about 80 words) explaining the relationships between the independent, dependent and any intervening or moderating variables drawn from the objectives. No citations. Then a plain text sketch that can be edited, written on separate lines like this:
Figure 2.1: Conceptual framework
INDEPENDENT VARIABLES: the variables, separated by semicolons
=>
DEPENDENT VARIABLE: the outcome
INTERVENING OR MODERATING VARIABLES: the variables, or the words "None identified"

${NO_META_COMMENTARY}`,
  };
}

function chapter3Spec(type: string): ChapterSpec {
  const proposal = type === 'proposal';
  const tense = proposal
    ? 'Write in the future tense because this is a proposal.'
    : 'Write in the past tense because the study has been completed.';
  const words = (n: number, fallback: string) => (proposal ? `About ${n} words. ` : fallback);
  return {
    id: 'chapter3',
    title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
    chapterLabel: 'CHAPTER THREE',
    chapterNumber: '3',
    instructions: `Write CHAPTER THREE exactly in this order. Print every heading exactly as shown. ${tense}

${citationRules(type)}
Cite the research methods books in the VERIFIED SOURCES for general methodological principles only (design, sampling, instruments, analysis, ethics). Cite at least ${proposal ? 4 : 3} different research methods books in this chapter, each where it genuinely fits.

CHAPTER THREE

3.0 Introduction
One short paragraph explaining what this chapter covers. No citations.

3.1 Research Approach
${words(60, 'One or two paragraphs. ')}State the approach (quantitative, qualitative or mixed methods) that fits the objectives and explain why in clear terms. Cite.

3.2 Research Design
${words(90, 'Two paragraphs. ')}Name the design, cite Creswell and Creswell (2023) for it, and justify why this design is the right one for these objectives.

3.3 Study Location
${words(60, 'One paragraph. ')}Describe the setting named or implied by the topic and why it suits the study.

3.4 Target Population
${words(60, 'One paragraph. ')}State exactly who the target population is and its size N. If the exact size is not in a verified source, present N as a planning estimate that must be confirmed from institutional records, and say so.

3.5 Sample Size
Name the sampling technique in one sentence. Then show the sample size calculation: write the formula in plain text, substitute the actual numbers, show the computed result, round up, state the final sample size, and justify it. Choose a formula that suits the design and the population (for example a finite population formula for surveys, or saturation reasoning for qualitative designs). Write subtraction as the word "minus". About 130 words.

3.6 Data Collection Instruments and Procedures
${words(100, 'Two paragraphs. ')}Describe the instrument or instruments, how they will be developed and administered, and the procedure. Cite.

3.7 Data Analysis Plan
${words(90, 'Two paragraphs. ')}Name the software and the analysis for each objective, be consistent with the design and the sample, and justify the choices. Cite.

3.8 Reliability and Validity
${words(60, 'One paragraph. ')}Explain how reliability and validity (or trustworthiness for qualitative work) will be established.

3.9 Ethical Considerations
${words(90, 'One paragraph. ')}Cover ethical clearance, informed consent, confidentiality, voluntary participation, data protection and risk to participants.

${NO_META_COMMENTARY}`,
  };
}

const PROPOSAL_BACK_MATTER = `Write ONLY the following, in this order, as plain text, matched to this topic and to the design chosen in Chapter Three.

APPENDICES

APPENDIX A: WORK PLAN
State the total duration in months. Then list 7 to 9 activities (for example proposal approval, ethical clearance, instrument piloting, data collection, analysis, report writing, dissemination, adapted to this study), one per line in the form: Activity: Month X to Month Y.

APPENDIX B: BUDGET
CURRENCY: the three letter code of the currency that suits the study setting
BUDGET_LINES
Item | Quantity | Unit cost
(8 to 12 realistic items, one per line, using plain numbers only: no totals, no currency symbols)
END_BUDGET_LINES

APPENDIX C: DATA COLLECTION INSTRUMENT
The complete instrument that matches the design in Chapter Three (questionnaire, interview guide or checklist). Begin with a short informed consent statement. Then give sections lettered A, B, C and D with numbered items, at least 15 items in total, so that every specific objective is covered. Use closed and open items as the design requires.

${NO_META_COMMENTARY}`;

const RESEARCH_BACK_MATTER = `Write ONLY the following, in this order, as plain text, matched to this topic and design.

APPENDICES

APPENDIX A: DATA COLLECTION INSTRUMENT
The complete instrument used in the study (questionnaire, interview guide or checklist), with numbered items grouped under lettered sections that cover every specific objective.

APPENDIX B: PARTICIPANT INFORMATION SHEET AND INFORMED CONSENT
A participant information sheet followed by a consent statement. State the purpose, procedures, voluntary participation, confidentiality, risks and benefits, and who to contact.

${NO_META_COMMENTARY}`;

function buildResearchSpecs(): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: frontMatterTask('research'),
    },
    chapter1Spec('research'),
    chapter2Spec('research'),
    chapter3Spec('research'),
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write CHAPTER FOUR. No citations anywhere in this chapter. Follow the design and objectives in the brief and organise the findings by specific objective.

CHAPTER FOUR

4.0 Introduction
One short paragraph.

4.1 Descriptive and Demographic Results
Present the participant characteristics in text form.

4.2 Key Thematic or Statistical Findings
Present the findings under one sub heading per specific objective, numbered 4.2.1, 4.2.2 and 4.2.3, using the analysis named in Chapter Three.

4.3 Summary of Findings
Two to three paragraphs.

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write CHAPTER FIVE.

${citationRules('research')}

CHAPTER FIVE

5.0 Introduction
One short paragraph. No citations.

5.1 Interpretation of Key Findings
Interpret the findings objective by objective.

5.2 Comparison with Previous Studies
Compare and contrast the findings with the verified literature, explain agreements and differences, and cite.

5.3 Implications for Practice and Policy
Discuss the implications, citing where it helps.

5.4 Limitations of the Study
Discuss the limitations honestly. No citations.

${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write CHAPTER SIX. No citations anywhere in this chapter.

CHAPTER SIX

6.0 Introduction
One short paragraph.

6.1 Conclusions
One conclusion paragraph for each specific objective, then a closing paragraph.

6.2 Recommendations
Practical recommendations linked to the conclusions, grouped for practice, policy and further research.

${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: '',
      backMatter: RESEARCH_BACK_MATTER,
    },
  ];
}

function buildProposalSpecs(): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: frontMatterTask('proposal'),
    },
    chapter1Spec('proposal'),
    chapter2Spec('proposal'),
    chapter3Spec('proposal'),
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: '',
      backMatter: PROPOSAL_BACK_MATTER,
    },
  ];
}

function buildAssignmentSpecs(): ChapterSpec[] {
  return [
    {
      id: 'title',
      title: 'TITLE PAGE',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a TITLE PAGE: the title in capital letters, the document type, the academic level, and the line "Prepared for academic assessment". No names or placeholders. ${NO_META_COMMENTARY}`,
    },
    {
      id: 'introduction',
      title: '1.0 INTRODUCTION',
      chapterLabel: '',
      chapterNumber: '1',
      instructions: `Write the section headed "1.0 INTRODUCTION": context and importance of the topic, a clear thesis or purpose, and a short outline of how the answer is organised. Cite verified sources for context. ${NO_META_COMMENTARY}`,
    },
    {
      id: 'body',
      title: '2.0 MAIN BODY',
      chapterLabel: '',
      chapterNumber: '2',
      instructions: `Write the section headed "2.0 MAIN BODY" with sub headings numbered 2.1, 2.2, 2.3 and so on (4 to 6 of them) that answer the topic in a logical order. In each sub section explain, analyse and evaluate with verified evidence, compare viewpoints and apply the ideas. Do not just describe. ${NO_META_COMMENTARY}`,
    },
    {
      id: 'conclusion',
      title: '3.0 CONCLUSION',
      chapterLabel: '',
      chapterNumber: '3',
      instructions: `Write the section headed "3.0 CONCLUSION": the main arguments, the answer to the topic and a closing judgement. No new evidence. ${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: '4.0 REFERENCES',
      chapterLabel: '',
      chapterNumber: '4',
      instructions: '',
    },
  ];
}

function buildCaseStudySpecs(): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY a LIST OF ABBREVIATIONS AND ACRONYMS.\n${ABBREVIATION_RULE}\n${NO_META_COMMENTARY}`,
    },
    chapter1Spec('proposal-lite'),
    chapter2Spec('proposal-lite'),
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write CHAPTER THREE as a case study methodology with headings 3.0 Introduction, 3.1 Case Selection and Rationale, 3.2 Research Design, 3.3 Data Sources, 3.4 Data Collection, 3.5 Data Analysis, 3.6 Trustworthiness, 3.7 Ethical Considerations. Cite the research methods books in the VERIFIED SOURCES for general principles only. ${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: '',
    },
  ];
}

function buildReportSpecs(): ChapterSpec[] {
  const section = (id: string, num: string, title: string, task: string): ChapterSpec => ({
    id,
    title,
    chapterLabel: '',
    chapterNumber: num,
    instructions: `${task} ${NO_META_COMMENTARY}`,
  });
  return [
    section('title', '', 'TITLE PAGE', 'Write a TITLE PAGE: the title in capital letters, the document type and the academic level. No names or placeholders.'),
    section('executive', '', 'EXECUTIVE SUMMARY', 'Write the EXECUTIVE SUMMARY (about 250 words): purpose, key findings, conclusions and recommendations. Cite sparingly.'),
    section('introduction', '1', '1.0 INTRODUCTION', 'Write "1.0 INTRODUCTION": background, purpose, scope and structure of the report, with verified citations for context.'),
    section('findings', '2', '2.0 FINDINGS AND RESULTS', 'Write "2.0 FINDINGS AND RESULTS" with numbered sub sections (2.1, 2.2, 2.3). Present and explain the evidence from the verified sources and organise it by theme.'),
    section('discussion', '3', '3.0 DISCUSSION', 'Write "3.0 DISCUSSION": interpret the findings, compare viewpoints, and explain implications, citing verified sources.'),
    section('recommendations', '4', '4.0 RECOMMENDATIONS', 'Write "4.0 RECOMMENDATIONS": specific, practical, prioritised recommendations that follow from the discussion.'),
    section('conclusion', '5', '5.0 CONCLUSION', 'Write "5.0 CONCLUSION": the main points and a closing judgement. No new evidence.'),
    { id: 'references', title: '6.0 REFERENCES', chapterLabel: '', chapterNumber: '6', instructions: '' },
  ];
}

function buildChapterSpecs(docType: string): ChapterSpec[] {
  switch (docType) {
    case 'essay':
      return buildAssignmentSpecs();
    case 'report':
      return buildReportSpecs();
    case 'case-study':
      return buildCaseStudySpecs();
    case 'proposal':
      return buildProposalSpecs();
    case 'research':
    default:
      return buildResearchSpecs();
  }
}

function noCiteSections(type: string, chapterId: string): string[] {
  if (type !== 'proposal' && type !== 'research') return [];
  const map: Record<string, string[]> = {
    frontmatter: ['*'],
    chapter1: ['1.0', '1.3', '1.3.1', '1.3.2', '1.4'],
    chapter2: ['2.0', '2.1.0', '2.3'],
    chapter3: ['3.0'],
  };
  if (type === 'research') {
    map.chapter4 = ['*'];
    map.chapter5 = ['5.0', '5.4'];
    map.chapter6 = ['*'];
  }
  return map[chapterId] || [];
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

    return { text: '', apiUsed: 'none', error: `All providers failed` };
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

  return { text: '', apiUsed: 'none', error: `All providers failed` };
}

// ============================================================
// TEXT CLEANING
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

// Safety net for the proposal rule "no hyphens or dashes". Spaced hyphens between numbers are left alone
// so that formulas are not damaged.
function fixDashes(text: string): string {
  return text
    .replace(/(\d)\s*[–—-]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/(\p{L})-(\p{L})/gu, '$1 $2')
    .replace(/(\p{L})\s+-\s+(\p{L})/gu, '$1, $2');
}

// ============================================================
// VERIFIED SOURCES (OpenAlex first, Crossref as fallback)
// ============================================================
const NAME_PARTICLES = new Set([
  'van', 'von', 'der', 'den', 'de', 'da', 'del', 'della', 'di', 'du', 'le', 'la', 'bin', 'ibn', 'al', 'el', 'dos', 'das', 'ter', 'ten',
]);

function splitName(full: string): { family: string; given: string } {
  const parts = full.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (parts.length === 0) return { family: '', given: '' };
  if (parts.length === 1) return { family: parts[0], given: '' };
  let famStart = parts.length - 1;
  while (famStart > 1 && NAME_PARTICLES.has(parts[famStart - 1].toLowerCase())) famStart--;
  return { family: parts.slice(famStart).join(' '), given: parts.slice(0, famStart).join(' ') };
}

function fixCase(s: string): string {
  if (s.length > 3 && s === s.toUpperCase()) {
    return s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a, b) => a + b.toUpperCase());
  }
  return s;
}

function initials(given: string): string {
  return given
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      if (/^([A-Za-z]\.)+$/.test(tok)) return tok;
      return tok
        .split('-')
        .filter(Boolean)
        .map((x) => x.charAt(0).toUpperCase() + '.')
        .join('-');
    })
    .join(' ');
}

function apaAuthors(list: { family: string; given: string }[]): string {
  const f = list.map((a) => (a.given ? `${a.family}, ${initials(a.given)}` : a.family));
  if (f.length === 1) return f[0];
  if (f.length <= 20) return `${f.slice(0, -1).join(', ')}, & ${f[f.length - 1]}`;
  return `${f.slice(0, 19).join(', ')}, ... ${f[f.length - 1]}`;
}

function inTextAuthors(list: { family: string }[]): { par: string; nar: string } {
  const fam = list.map((a) => a.family);
  if (fam.length === 1) return { par: fam[0], nar: fam[0] };
  if (fam.length === 2) return { par: `${fam[0]} & ${fam[1]}`, nar: `${fam[0]} and ${fam[1]}` };
  return { par: `${fam[0]} et al.`, nar: `${fam[0]} et al.` };
}

function normKey(authors: string, year: string): string {
  return `${authors} ${year}`
    .toLowerCase()
    .replace(/\band\b/g, '&')
    .replace(/[^\p{L}\p{N}& ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(t: string): string {
  const stripped = t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (stripped.length > 8 && stripped === stripped.toUpperCase()) {
    const lower = stripped.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return stripped;
}

function rebuildAbstract(inv: Record<string, number[]> | null | undefined): string {
  if (!inv) return '';
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter(Boolean).join(' ');
}

function snippet(text: string, max = 230): string {
  const t = text.replace(/<[^>]+>/g, ' ').replace(/^\s*abstract[:.\s]*/i, '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut.slice(0, cut.lastIndexOf(' '))).trim();
}

async function fetchJson(url: string, timeoutMs = 9000): Promise<any> {
  const res = await fetchWithTimeout(
    url,
    { headers: { Accept: 'application/json', 'User-Agent': 'VetSphereAcademicWriter/1.0' } },
    timeoutMs
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchOpenAlex(query: string, fromYear: number, n: number): Promise<RawWork[]> {
  const mailto = CONTACT_EMAIL ? `&mailto=${encodeURIComponent(CONTACT_EMAIL)}` : '';
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
    `&filter=from_publication_date:${fromYear}-01-01,type:article,has_doi:true,has_abstract:true,is_retracted:false` +
    `&per-page=${n}` +
    `&select=id,doi,title,publication_year,authorships,biblio,primary_location,abstract_inverted_index${mailto}`;
  const data = await fetchJson(url);
  return (data.results || []).map((w: any) => ({
    authors: (w.authorships || [])
      .map((a: any) => splitName(a?.author?.display_name || ''))
      .filter((a: { family: string }) => a.family),
    year: Number(w.publication_year) || 0,
    title: cleanTitle(w.title || ''),
    journal: w.primary_location?.source?.display_name || '',
    volume: w.biblio?.volume || '',
    issue: w.biblio?.issue || '',
    pages:
      w.biblio?.first_page && w.biblio?.last_page && w.biblio.first_page !== w.biblio.last_page
        ? `${w.biblio.first_page}–${w.biblio.last_page}`
        : w.biblio?.first_page || '',
    doi: w.doi || '',
    abstract: rebuildAbstract(w.abstract_inverted_index),
  }));
}

async function searchCrossref(query: string, fromYear: number, n: number): Promise<RawWork[]> {
  const mailto = CONTACT_EMAIL ? `&mailto=${encodeURIComponent(CONTACT_EMAIL)}` : '';
  const url =
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}` +
    `&filter=from-pub-date:${fromYear}-01,type:journal-article,has-abstract:true` +
    `&rows=${n}&select=DOI,title,author,issued,container-title,volume,issue,page,abstract${mailto}`;
  const data = await fetchJson(url);
  return (data.message?.items || []).map((w: any) => ({
    authors: (w.author || [])
      .map((a: any) =>
        a.family
          ? { family: a.family as string, given: (a.given || '') as string }
          : { family: (a.name || '') as string, given: '' }
      )
      .filter((a: { family: string }) => a.family),
    year: Number(w.issued?.['date-parts']?.[0]?.[0]) || 0,
    title: cleanTitle(w.title?.[0] || ''),
    journal: w['container-title']?.[0] || '',
    volume: w.volume || '',
    issue: w.issue || '',
    pages: (w.page || '').replace(/-/g, '–'),
    doi: w.DOI ? `https://doi.org/${w.DOI}` : '',
    abstract: w.abstract || '',
  }));
}

async function searchWorks(query: string, fromYear: number, n: number): Promise<RawWork[]> {
  try {
    const a = await searchOpenAlex(query, fromYear, n);
    if (a.length > 0) return a;
  } catch (e) {
    console.error('OpenAlex error:', e);
  }
  try {
    return await searchCrossref(query, fromYear, n);
  } catch (e) {
    console.error('Crossref error:', e);
    return [];
  }
}

function isUsableWork(w: RawWork, minYear: number): boolean {
  if (!w.authors.length || !w.title || w.title.length < 15) return false;
  if (!w.year || w.year < minYear || w.year > new Date().getFullYear() + 1) return false;
  if (!w.doi || !w.journal) return false;
  if (snippet(w.abstract).length < 100) return false;
  if (/^(erratum|correction|corrigendum|retraction|editorial|comment on|reply to|in this issue)\b/i.test(w.title)) return false;
  if (/\b(retracted|withdrawn)\b/i.test(w.title)) return false;
  return true;
}

function formatRef(w: RawWork): string {
  const authors = apaAuthors(
    w.authors.map((a) => ({ family: fixCase(a.family), given: fixCase(a.given) }))
  );
  const title = /[.?!]$/.test(w.title) ? w.title : `${w.title}.`;
  let src = w.journal;
  if (w.volume) src += `, ${w.volume}`;
  if (w.issue) src += `(${w.issue})`;
  if (w.pages) src += `, ${w.pages}`;
  const doi = w.doi.startsWith('http') ? w.doi : `https://doi.org/${w.doi}`;
  return `${authors} (${w.year}). ${title} ${src}. ${doi}`;
}

function toSource(w: RawWork, id: string): Source {
  const fam = w.authors.map((a) => ({ family: fixCase(a.family) }));
  const { par, nar } = inTextAuthors(fam);
  return {
    i: id,
    r: formatRef(w),
    p: `${par}, ${w.year}`,
    n: `${nar} (${w.year})`,
    s: snippet(w.abstract),
    d: w.doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, ''),
  };
}

async function gatherSources(
  queries: string[],
  perQuery: number,
  existing: Source[],
  maxNew: number
): Promise<Source[]> {
  if (maxNew <= 0 || queries.length === 0) return [];
  const minYear = new Date().getFullYear() - YEARS_BACK;
  const settled = await Promise.all(
    queries.map((q) => searchWorks(q, minYear, perQuery).catch(() => [] as RawWork[]))
  );
  const merged: RawWork[] = [];
  for (let k = 0; k < perQuery; k++) {
    for (const list of settled) if (list[k]) merged.push(list[k]);
  }

  const seenDoi = new Set(existing.map((s) => s.d));
  const seenKey = new Set(existing.map((s) => normKey(s.p, '')));
  let counter = existing.reduce((m, s) => Math.max(m, parseInt(s.i.replace(/\D/g, ''), 10) || 0), 0);
  const out: Source[] = [];

  for (const w of merged) {
    if (out.length >= maxNew) break;
    if (!isUsableWork(w, minYear)) continue;
    const src = toSource(w, `S${counter + 1}`);
    if (!src.d || seenDoi.has(src.d)) continue;
    const key = normKey(src.p, '');
    // Two works with the same first author and year would need a/b suffixes. Skip the later one instead.
    if (seenKey.has(key)) continue;
    seenDoi.add(src.d);
    seenKey.add(key);
    counter++;
    out.push(src);
  }
  return out;
}

const METHODS_BOOKS: Source[] = [
  {
    i: 'M1',
    r: 'Creswell, J. W., & Creswell, J. D. (2023). Research design: Qualitative, quantitative, and mixed methods approaches (6th ed.). SAGE Publications.',
    p: 'Creswell & Creswell, 2023',
    n: 'Creswell and Creswell (2023)',
    s: 'Textbook on research design covering qualitative, quantitative and mixed methods approaches, including choosing an approach, designs, data collection, analysis and ethical issues.',
    d: 'book-m1',
    b: true,
  },
  {
    i: 'M2',
    r: 'Saunders, M., Lewis, P., & Thornhill, A. (2023). Research methods for business students (9th ed.). Pearson Education.',
    p: 'Saunders et al., 2023',
    n: 'Saunders et al. (2023)',
    s: 'Textbook on research methods covering research approaches and strategies, sampling, data collection, data analysis and research ethics.',
    d: 'book-m2',
    b: true,
  },
  {
    i: 'M3',
    r: 'Bryman, A. (2016). Social research methods (5th ed.). Oxford University Press.',
    p: 'Bryman, 2016',
    n: 'Bryman (2016)',
    s: 'Textbook on social research methods covering quantitative and qualitative designs, sampling, questionnaires, interviews and data analysis.',
    d: 'book-m3',
    b: true,
  },
  {
    i: 'M4',
    r: 'Kumar, R. (2019). Research methodology: A step-by-step guide for beginners (5th ed.). SAGE Publications.',
    p: 'Kumar, 2019',
    n: 'Kumar (2019)',
    s: 'Guide to the research process covering problem formulation, research design, sampling, instrument construction, data collection and analysis, and ethics.',
    d: 'book-m4',
    b: true,
  },
  {
    i: 'M5',
    r: 'Kothari, C. R., & Garg, G. (2019). Research methodology: Methods and techniques (4th ed.). New Age International Publishers.',
    p: 'Kothari & Garg, 2019',
    n: 'Kothari and Garg (2019)',
    s: 'Textbook on research methodology covering research design, sampling and sample size determination, data collection techniques, and analysis.',
    d: 'book-m5',
    b: true,
  },
];

async function planQueries(topic: string): Promise<string[]> {
  const fallback = heuristicQueries(topic);
  const prompt = `Return ONLY a JSON array of 8 short academic literature search queries (3 to 6 plain keywords each, no quotation marks) for the research topic below. Cover: the main subject and variables; global burden or background; evidence from Africa or other developing regions; the study population; risk factors or determinants; interventions, practices or outcomes; and methods commonly used. Avoid place names unless the topic is about that place.

Topic: "${topic}"`;
  try {
    const r = await generateSection(prompt, 500, true);
    const m = r.text.match(/\[[\s\S]*\]/);
    if (m) {
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr)) {
        const qs = arr
          .filter((q) => typeof q === 'string' && q.trim().length > 3)
          .map((q: string) => q.replace(/["“”]/g, '').trim().slice(0, 120));
        if (qs.length >= 3) return Array.from(new Set(qs)).slice(0, 8);
      }
    }
  } catch (e) {
    console.error('Query planning failed:', e);
  }
  return fallback;
}

function heuristicQueries(topic: string): string[] {
  const head = topic.split(':')[0].trim();
  const words = head.split(/\s+/).filter(Boolean);
  const list = [
    head,
    words.slice(0, 6).join(' '),
    words.slice(-6).join(' '),
    `${words.slice(0, 4).join(' ')} Africa`,
    `${words.slice(0, 4).join(' ')} risk factors`,
  ];
  return Array.from(new Set(list.filter((q) => q.length > 3)));
}

function objectiveToQuery(obj: string): string {
  return obj
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/^to\s+\w+\s+/i, '')
    .split(/\s+/)
    .slice(0, 10)
    .join(' ')
    .replace(/[.;,]+$/, '');
}

function sourcesForPrompt(sources: Source[], priority: Set<string>): string {
  const limit = Math.min(34, Math.max(PROMPT_SOURCE_LIMIT, priority.size + 12));
  const ordered = [
    ...sources.filter((s) => priority.has(s.i)),
    ...sources.filter((s) => !priority.has(s.i) && !s.u),
    ...sources.filter((s) => !priority.has(s.i) && s.u),
  ].slice(0, limit);
  return ordered
    .map(
      (s) =>
        `${s.i}. CITE AS (${s.p}) | NARRATIVE ${s.n} | WORK: ${s.r.replace(/\s*https?:\/\/\S+$/, '')} | SUMMARY: ${s.s}`
    )
    .join('\n');
}

// ============================================================
// CITATION CHECKING
// ============================================================
const CITE_PART =
  /^(?:e\.g\.,\s*|see\s+|cf\.\s*)?(.+?),\s*((?:19|20)\d{2}[a-z]?)(?:,\s*pp?\.\s*[\d–-]+)?$/u;
const NARRATIVE_CITE =
  /\b([A-Z][\p{L}'’-]+(?: et al\.| (?:and|&) [A-Z][\p{L}'’-]+)?) \(((?:19|20)\d{2}[a-z]?)\)/gu;

function looksLikeAuthors(a: string): boolean {
  return /^[A-Z]/.test(a) && a.length <= 90 && !/[0-9=<>]/.test(a) && !/^(Table|Figure|Chapter|Section|Appendix|Box)\b/.test(a);
}

function sanitizeCitations(
  text: string,
  allowed: Set<string>,
  stripAll: boolean
): { text: string; removed: number; used: Set<string> } {
  const used = new Set<string>();
  let removed = 0;

  let out = text.replace(/ ?\(([^()]*?(?:19|20)\d{2}[a-z]?[^()]*?)\)/g, (m: string, inner: string) => {
    const lead = m.startsWith(' ') ? ' ' : '';
    const parts = inner.split(';').map((s) => s.trim());
    const kept: string[] = [];
    let shaped = 0;
    for (const part of parts) {
      const mm = part.match(CITE_PART);
      if (mm && looksLikeAuthors(mm[1])) {
        shaped++;
        const key = normKey(mm[1], mm[2]);
        if (!stripAll && allowed.has(key)) {
          kept.push(part);
          used.add(key);
        } else {
          removed++;
        }
      } else {
        kept.push(part);
      }
    }
    if (shaped === 0) return m;
    if (kept.length === 0) return '';
    return `${lead}(${kept.join('; ')})`;
  });

  out = out.replace(NARRATIVE_CITE, (m: string, authors: string, year: string, offset: number, whole: string) => {
    const key = normKey(authors, year);
    if (!stripAll && allowed.has(key)) {
      used.add(key);
      return m;
    }
    removed++;
    const before = whole.slice(Math.max(0, offset - 2), offset);
    const atStart = offset === 0 || /[.!?:\n]\s?$/.test(before);
    return atStart ? 'Earlier studies' : 'other studies';
  });

  return { text: out, removed, used };
}

function enforceCitations(
  text: string,
  allowed: Set<string>,
  noCite: string[]
): { text: string; removed: number; used: Set<string> } {
  if (noCite.includes('*')) {
    const r = sanitizeCitations(text, allowed, true);
    return { text: r.text, removed: r.removed, used: new Set<string>() };
  }
  const used = new Set<string>();
  let removed = 0;
  let current = '';
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const h = line.trim().match(/^(\d+\.\d+(?:\.\d+)?)\s+[A-Z]/);
    if (h) current = h[1];
    const r = sanitizeCitations(line, allowed, noCite.includes(current));
    removed += r.removed;
    r.used.forEach((k) => used.add(k));
    out.push(r.text);
  }
  return { text: out.join('\n'), removed, used };
}

// ============================================================
// DOCUMENT STATE (carried through the client as an opaque string)
// ============================================================
function emptyState(): DocState {
  return { brief: { general: '', objectives: [], questions: [], abbreviations: '' }, sources: [] };
}

function unpackState(previousContext: string): { state: DocState; tail: string } {
  if (!previousContext) return { state: emptyState(), tail: '' };
  const start = previousContext.indexOf(STATE_OPEN);
  const end = previousContext.indexOf(STATE_CLOSE);
  if (start === -1 || end === -1 || end < start) {
    return { state: emptyState(), tail: previousContext.slice(-MAX_TAIL_CHARS) };
  }
  try {
    const parsed = JSON.parse(previousContext.slice(start + STATE_OPEN.length, end));
    const base = emptyState();
    const brief: Brief = {
      general: String(parsed?.brief?.general || ''),
      objectives: Array.isArray(parsed?.brief?.objectives) ? parsed.brief.objectives.map(String) : [],
      questions: Array.isArray(parsed?.brief?.questions) ? parsed.brief.questions.map(String) : [],
      abbreviations: String(parsed?.brief?.abbreviations || ''),
    };
    const sources: Source[] = Array.isArray(parsed?.sources)
      ? parsed.sources.filter((s: any) => s && typeof s.i === 'string' && typeof s.r === 'string' && typeof s.p === 'string')
      : base.sources;
    return { state: { brief, sources }, tail: previousContext.slice(end + STATE_CLOSE.length).trim() };
  } catch {
    return { state: emptyState(), tail: previousContext.slice(-MAX_TAIL_CHARS) };
  }
}

function packState(state: DocState, tail: string): string {
  return `${STATE_OPEN}${JSON.stringify(state)}${STATE_CLOSE}\n${tail}`;
}

function sectionLines(text: string, startRe: RegExp, endRe: RegExp): string[] {
  const lines = text.split('\n').map((l) => l.trim());
  const s = lines.findIndex((l) => startRe.test(l));
  if (s === -1) return [];
  let e = lines.findIndex((l, i) => i > s && endRe.test(l));
  if (e === -1) e = lines.length;
  return lines.slice(s + 1, e).filter(Boolean);
}

function updateBrief(brief: Brief, chapterId: string, text: string): Brief {
  const next: Brief = { ...brief };
  if (chapterId === 'frontmatter') {
    const abbr = sectionLines(text, /^LIST OF ABBREVIATIONS/i, /^\u0000$/);
    next.abbreviations = abbr.join('; ').slice(0, 700);
  }
  if (chapterId === 'chapter1') {
    next.general = sectionLines(text, /^1\.3\.1\b/, /^1\.3\.2\b/).join(' ').slice(0, 400);
    next.objectives = sectionLines(text, /^1\.3\.2\b/, /^1\.4\b/).slice(0, 4);
    next.questions = sectionLines(text, /^1\.4\b/, /^1\.5\b/).slice(0, 4);
  }
  return next;
}

function briefForPrompt(b: Brief): string {
  const parts: string[] = [];
  if (b.general) parts.push(`General objective: ${b.general}`);
  if (b.objectives.length) parts.push(`Specific objectives (verbatim):\n${b.objectives.join('\n')}`);
  if (b.questions.length) parts.push(`Research questions (verbatim):\n${b.questions.join('\n')}`);
  if (b.abbreviations) {
    parts.push(
      b.abbreviations === 'None required.'
        ? 'Abbreviations permitted: none. Write every term in full.'
        : `Abbreviations permitted (use no others): ${b.abbreviations}`
    );
  }
  return parts.length ? parts.join('\n') : 'No brief yet.';
}

// ============================================================
// REFERENCE LIST AND BACK MATTER
// ============================================================
function buildReferenceList(sources: Source[]): string {
  const used = sources.filter((s) => s.u);
  if (used.length === 0) return 'No verified sources were cited in this document.';
  return used
    .map((s) => s.r)
    .sort((a, b) => a.toLowerCase().replace(/[^a-z0-9]/g, '').localeCompare(b.toLowerCase().replace(/[^a-z0-9]/g, '')))
    .join('\n\n');
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function renderBudget(text: string): string {
  const block = /BUDGET_LINES\s*\n([\s\S]*?)\n\s*END_BUDGET_LINES/;
  const m = text.match(block);
  const strip = (t: string) => t.replace(/END_BUDGET_LINES|BUDGET_LINES/g, '');
  if (!m) return strip(text);
  const cur = (text.match(/CURRENCY:\s*([A-Za-z]{2,5})/) || [])[1] || '';
  const lines: string[] = [];
  let total = 0;
  for (const raw of m[1].split('\n')) {
    const c = raw.split('|').map((x) => x.trim());
    if (c.length < 3 || !/\d/.test(c[1]) || !/\d/.test(c[2])) continue;
    const q = parseFloat(c[1].replace(/,/g, ''));
    const u = parseFloat(c[2].replace(/[^0-9.]/g, ''));
    if (!isFinite(q) || !isFinite(u)) continue;
    const line = q * u;
    total += line;
    lines.push(`${lines.length + 1}. ${c[0]}: ${fmtNum(q)} × ${fmtNum(u)} = ${fmtNum(line)}`);
  }
  if (lines.length < 3) return strip(text);
  lines.push(`TOTAL BUDGET: ${cur ? `${cur} ` : ''}${fmtNum(total)}`);
  const note = cur ? `All amounts are in ${cur}.` : '';
  return text
    .replace(/CURRENCY:[^\n]*\n?/, note ? `${note}\n` : '')
    .replace(/BUDGET_LINES[\s\S]*?END_BUDGET_LINES/, lines.join('\n'));
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

    const chapters = buildChapterSpecs(type);
    const totalChapters = chapters.length;

    if (chapterIndex < 0 || chapterIndex >= chapters.length) {
      return NextResponse.json(
        { error: `Invalid chapterIndex ${chapterIndex}. This document type has ${chapters.length} chapters.` },
        { status: 400 }
      );
    }

    const idx = chapterIndex;
    const chapter = chapters[idx];
    const strictType = type === 'proposal' || type === 'research' ? type : 'other';

    // ------------------------------------------------------------
    // 1. Restore the document state, then make sure we have verified sources
    // ------------------------------------------------------------
    const restored = unpackState(previousContext);
    let brief = restored.state.brief;
    let sources = restored.state.sources;
    const tail = restored.tail;
    const priority = new Set<string>();

    if (sources.filter((s) => !s.b).length === 0) {
      const queries = await planQueries(cleanTopic);
      const fresh = await gatherSources(queries, 6, [], 30);
      if (fresh.length < 5) {
        return NextResponse.json(
          {
            error:
              'Could not retrieve enough verified literature sources for this topic right now. Please retry; no unverified references will be written.',
          },
          { status: 502 }
        );
      }
      sources = fresh;
    }

    // Theme specific sources for the literature review, based on the objectives written in Chapter One.
    if (chapter.id === 'chapter2' && brief.objectives.length > 0) {
      const room = MAX_POOL - sources.filter((s) => !s.b).length;
      const extra = await gatherSources(brief.objectives.slice(0, 4).map(objectiveToQuery), 7, sources, Math.min(18, room));
      extra.forEach((s) => priority.add(s.i));
      sources = sources.concat(extra);
    }

    // Research methods books for the methodology chapter.
    if (chapter.id === 'chapter3') {
      for (const book of METHODS_BOOKS) {
        if (!sources.some((s) => s.i === book.i)) sources = sources.concat({ ...book });
        priority.add(book.i);
      }
    }

    // ------------------------------------------------------------
    // 2. References chapter: code builds the list, the model only writes the back matter
    // ------------------------------------------------------------
    if (chapter.id === 'references') {
      const heading = chapter.chapterLabel === 'REFERENCES' ? 'REFERENCES' : chapter.title;
      let result = `${heading}\n\n${buildReferenceList(sources)}`;
      let apiUsed = 'verified sources';

      if (chapter.backMatter) {
        const backPrompt = `You are an expert academic writer producing a ${levelInfo.depth} ${typeLabel}.

TOPIC: "${cleanTopic}"

DOCUMENT BRIEF:
${briefForPrompt(brief)}

${tail ? `END OF THE PREVIOUS CHAPTER (for consistency):\n${tail}\n` : ''}
TASK: ${chapter.backMatter}
${COMMON_STYLE}
${type === 'proposal' ? PROPOSAL_STYLE : ''}`;
        const gen = await generateSection(backPrompt, 5000, true);
        if (!gen.text) {
          return NextResponse.json(
            { error: `Failed to generate "${chapter.title}". ${gen.error}` },
            { status: 502 }
          );
        }
        let back = cleanText(gen.text);
        if (type === 'proposal') back = fixDashes(back);
        back = renderBudget(back);
        result = `${result}\n\n${back}`;
        apiUsed = gen.apiUsed;
      }

      return NextResponse.json({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterLabel: chapter.chapterLabel,
        chapterNumber: chapter.chapterNumber,
        content: result,
        apiUsed,
        isLastChapter: idx === chapters.length - 1,
        nextChapterIndex: idx + 1,
        contextForNextChapter: '',
        totalChapters,
        topic: cleanTopic,
        level,
        type,
        referencesListed: sources.filter((s) => s.u).length,
        generatedAt: new Date().toISOString(),
      });
    }

    // ------------------------------------------------------------
    // 3. Ordinary chapters
    // ------------------------------------------------------------
    const depthInstruction = `
DEPTH:
This is a ${levelInfo.label} academic document. Write substantial paragraphs of at least 5 sentences with real analysis, not brief summaries. Respect every word count and paragraph count given in the task.
`;

    const prompt = `You are an expert academic writer producing a ${levelInfo.depth} ${typeLabel}.

TOPIC: "${cleanTopic}"

DOCUMENT BRIEF (keep every chapter consistent with it):
${briefForPrompt(brief)}

${depthInstruction}
${SOURCE_RULES}
VERIFIED SOURCES (the only works you may cite; all were retrieved from scholarly databases and are published in the last ${YEARS_BACK} years):
${sourcesForPrompt(sources, priority)}

${tail ? `END OF THE PREVIOUS SECTION (for continuity only, do not repeat it):\n${tail}\n` : 'This is the first section.\n'}
TASK: ${chapter.instructions}

${COMMON_STYLE}
${type === 'proposal' ? PROPOSAL_STYLE : ''}`;

    const chapterTokenBudget = 4000;
    const { text, apiUsed, error } = await generateSection(prompt, chapterTokenBudget, true);

    if (!text) {
      return NextResponse.json(
        { error: `Failed to generate "${chapter.title}". ${error}` },
        { status: 502 }
      );
    }

    let cleaned = cleanText(text);
    if (type === 'proposal') cleaned = fixDashes(cleaned);

    // Remove any citation that is not in the verified list, and any citation in a section where none is allowed.
    const allowedKeys = new Set(sources.map((s) => normKey(s.p, '')));
    const enforced = enforceCitations(
      cleaned,
      allowedKeys,
      strictType === 'other' ? [] : noCiteSections(strictType, chapter.id)
    );
    cleaned = cleanText(enforced.text);

    sources = sources.map((s) => (enforced.used.has(normKey(s.p, '')) ? { ...s, u: true } : s));
    brief = updateBrief(brief, chapter.id, cleaned);

    if (chapter.id === 'frontmatter' && (type === 'proposal' || type === 'research')) {
      const label = type === 'proposal' ? 'A RESEARCH PROPOSAL' : 'A RESEARCH PAPER';
      cleaned = `${cleanTopic.toUpperCase()}\n\n${label}\n\n${cleaned}`;
    }

    const isLastChapter = idx === chapters.length - 1;
    const nextContext = packState({ brief, sources }, cleaned.slice(-MAX_TAIL_CHARS));

    return NextResponse.json({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterLabel: chapter.chapterLabel,
      chapterNumber: chapter.chapterNumber,
      content: cleaned,
      apiUsed,
      isLastChapter,
      nextChapterIndex: idx + 1,
      contextForNextChapter: nextContext,
      totalChapters,
      topic: cleanTopic,
      level,
      type,
      verifiedSourcesInPool: sources.filter((s) => !s.b).length,
      unverifiedCitationsRemoved: enforced.removed,
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
