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

// Shared rules injected into every chapter's front-matter / continuation instructions
// to stop the model from asking permission to continue or narrating its own process.
const NO_META_COMMENTARY = `
CRITICAL: NEVER include conversational meta-commentary, permission-asking, or narration
about what you are about to do (e.g. "Please let me know when to proceed", "Now I will
write the next chapter", "I will stop here"). Output ONLY the requested document content
itself - nothing else. Do not address the reader about the writing process.`;

// Shared table-formatting rule, used wherever a chapter may need to present numeric data.
const TABLE_FORMAT_RULE = `
TABLE FORMAT: Plain text only, EXCEPT when presenting numeric or comparative data, where a
properly formed markdown pipe table is allowed:
- Header row, then a separator row of dashes (|---|---|), then data rows
- Each row on its own single line, no blank lines between rows
- Every row must have the same number of columns as the header
Example:
| District | Coverage (%) |
|----------|--------------|
| Lusaka Central | 32 |
| Lusaka East | 41 |`;

interface ChapterSpec {
  id: string;
  title: string;
  chapterLabel: string;
  chapterNumber: string;
  instructions: string;
}

// ============================================================
// ASSIGNMENT SPECS - CORRECT STRUCTURE
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

CRITICAL: Use plain text only. No markdown. NO references here.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'introduction',
      title: '1.0 INTRODUCTION',
      chapterLabel: '',
      chapterNumber: '1',
      instructions: `Write a CONCISE INTRODUCTION (approximately 10% of total length) for this ASSIGNMENT.

CONTENT REQUIREMENTS:
- Brief context and background (1-2 sentences)
- Clear thesis statement or purpose (the argument you will make)
- Brief roadmap of what follows (1 sentence)
- NO detailed citations here - just set up the argument

LENGTH: 2-3 paragraphs (maximum 300-400 words)
FORMAT: Plain text only. No markdown.

CRITICAL: This is an ARGUMENT-DRIVEN assignment. Keep it focused and concise. DO NOT include references in the introduction - references go at the end.
${NO_META_COMMENTARY}`,
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

STRUCTURE:
2.1 [Theme/Sub-topic 1] - 3-4 paragraphs
2.2 [Theme/Sub-topic 2] - 3-4 paragraphs
2.3 [Theme/Sub-topic 3] - 3-4 paragraphs

LENGTH: 6-10 substantial paragraphs (minimum 1000-1500 words)
FORMAT: Plain text only. No markdown.
CITATIONS: Use APA 7th style throughout.

CRITICAL RULES:
- Topic sentences must state a claim, not just a subject
- Example: "Antibiotic overuse in livestock accelerates resistance" NOT "This section discusses antibiotics"
- Always link facts back to the question
- References appear ONLY at the end - NOT in the introduction
- Do NOT include a concluding or summary subsection (e.g. "2.6 Conclusion") within the Main Body.
  The document's Conclusion is a separate chapter that comes after this one - do not duplicate it here.
- Only cite specific statistics (percentages, rates, counts) that are well-established in the
  literature. If uncertain of an exact figure, describe the relationship qualitatively
  (e.g. "a substantial proportion of") rather than inventing a precise number.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'conclusion',
      title: '3.0 CONCLUSION',
      chapterLabel: '',
      chapterNumber: '3',
      instructions: `Write a CONCISE CONCLUSION (10-15% of total length) for this ASSIGNMENT.

CONTENT REQUIREMENTS:
- Synthesize the argument made in the body
- Answer the question posed in the introduction
- NO new information
- No new citations

LENGTH: 2-3 paragraphs (maximum 200-300 words)
FORMAT: Plain text only. No markdown.

CRITICAL: Do NOT introduce new ideas, evidence, or citations in the conclusion.
${NO_META_COMMENTARY}`,
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
- Mix of books, journal articles, and credible sources
- NO website URLs - use proper APA format
- All references must be cited in the text above

FORMAT: APA 7th edition

EXAMPLE FORMATS:
- Journal Article: Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), page-page. https://doi.org/xxxx
- Book: Author, A. A. (Year). Title of book. Publisher.
- Book Chapter: Author, A. A. (Year). Title of chapter. In A. A. Editor (Ed.), Title of book (pp. xx-xx). Publisher.

CRITICAL: Write out every reference in full. DO NOT include website URLs. Use proper APA format.
CRITICAL: Only include references you are highly confident actually exist. If uncertain whether a specific paper exists, prefer a well-known foundational text or review article in the field over inventing a specific study, author, or year.
${NO_META_COMMENTARY}`,
    },
  ];
}

// ============================================================
// CASE STUDY SPECS - WITH CHAPTERS LIKE RESEARCH PAPER
// ============================================================
function buildCaseStudySpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections:

TITLE PAGE: Case Study title, author name, student ID, course, institution, date
TABLE OF CONTENTS: List all section titles in order. Do NOT include page numbers -
  since chapters are generated independently, exact page numbers cannot be known yet.
  Use no trailing numbers, or write "[page]" as a placeholder if a number is required by format.
LIST OF ABBREVIATIONS: Any abbreviations used

Do NOT write any chapter content yet. Stop after the front matter.
${NO_META_COMMENTARY}
Do NOT ask the reader for permission to continue. Do NOT add any note, comment, or
question about what comes next. Simply end the output after the front matter content.

CRITICAL: Use plain text only. No markdown.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE Chapter One for a CASE STUDY.

CHAPTER ONE
1.0 INTRODUCTION
[Write 2-3 paragraphs]
- Why this case matters - significance and relevance
- Clear objective of the case study
- Brief overview of the case

LENGTH: 300-400 words
FORMAT: Plain text only. No markdown.

CRITICAL: NO references in the introduction. References go at the end.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: CASE PRESENTATION',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two: CASE PRESENTATION.

CRITICAL: FACTS ONLY - NO INTERPRETATION.

CONTENT REQUIREMENTS:
- Signalment (species, breed, age, sex, neuter status) - state this clearly and precisely, it will be referenced in Chapter Three
- History (presenting complaint, duration, previous treatments)
- Clinical examination findings (physical exam, vital signs)
- Diagnostics and test results (lab findings, imaging)
- Present all facts objectively and in detail

LENGTH: 500-700 words
FORMAT: Plain text only. No markdown.

CRITICAL RULES:
- DO NOT interpret findings here
- DO NOT discuss differentials here
- Present facts as facts only
- NO citations in this section - this is pure description
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: DISCUSSION AND ANALYSIS',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three: DISCUSSION AND ANALYSIS.

THIS IS THE CORE MARKED SECTION.

CONTENT REQUIREMENTS:
- Interpret the findings from Chapter Two
- Discuss differential diagnoses - rule in and rule out
- Compare to literature - reference relevant studies
- Justify every diagnosis with "why" (refer to literature)

CRITICAL - SIGNALMENT CONSISTENCY CHECK (do this before listing differentials):
- Reason from basic anatomy and physiology first: for conditions where sex-based anatomical
  differences are clinically significant (e.g. urethral obstruction is overwhelmingly a male-cat
  problem because the male urethra is longer and narrower than the female urethra), you MUST
  explicitly state this anatomical fact and explain how it changes the probability ranking for
  THIS patient's sex.
- Do NOT cite or invent a statistic to make the leading diagnosis fit the signalment. If a specific
  numeric claim about sex-based prevalence cannot be attributed to a real, well-known source, do not
  state a number at all - describe the relationship qualitatively instead (e.g. "obstruction is rare
  in female cats due to their wider, shorter urethra") rather than fabricating a precise incidence ratio.
- If the presenting complaint or requested focus (e.g. "possible urethral obstruction") is less
  consistent with this patient's signalment than with a different sex/age/breed, say so explicitly
  and rank differentials accordingly - do not let the framing of the question override the anatomy.

LENGTH: 800-1200 words
FORMAT: Plain text only. No markdown.
CITATIONS: Use APA 7th style throughout.

CRITICAL RULES:
- Every diagnosis needs a "why", justified against literature, not just stated
- Use real clinical terminology correctly
- Do NOT discuss treatment rationale here - that belongs in Chapter Four only
- Only cite specific statistics you are highly confident are accurate. If uncertain of an exact
  figure, describe the relationship qualitatively rather than inventing a precise number.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: MANAGEMENT AND OUTCOME',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE Chapter Four: MANAGEMENT AND OUTCOME.

CONTENT REQUIREMENTS:
- Treatment provided (specific details)
- Rationale for treatment (refer to literature) - this is the ONLY place treatment rationale belongs
- Prognosis - explain expected outcome, tied to specific findings from Chapter Two (not a generic statement)
- Follow-up and actual outcome
- Any complications or challenges

LENGTH: 400-600 words
FORMAT: Plain text only. No markdown.
CITATIONS: Use APA 7th style where appropriate.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: CONCLUSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a CONCISE Chapter Five: CONCLUSION.

CONTENT REQUIREMENTS:
- Summary of key points
- Tie back to the objective from Chapter One
- What was learned from this case
- No new information

LENGTH: 200-300 words
FORMAT: Plain text only. No markdown.

CRITICAL: No new citations in the conclusion.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write a COMPLETE REFERENCE LIST for this CASE STUDY.

REQUIREMENTS:
- 12-20 credible references in APA 7th edition format
- Mix of veterinary journals, textbooks, and clinical guidelines
- All references must be cited in the text above
- NO website URLs - use proper APA format

FORMAT: APA 7th edition

CRITICAL: Write out every reference in full.
CRITICAL: Only include references you are highly confident actually exist. If uncertain whether a specific paper exists, prefer a well-known foundational veterinary text or review article over inventing a specific study, author, or year.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'appendices',
      title: 'APPENDICES',
      chapterLabel: 'APPENDICES',
      chapterNumber: '',
      instructions: `Write a COMPLETE APPENDICES section for this CASE STUDY.

CONTENT REQUIREMENTS:
- Describe any raw data (lab results, test values)
- Describe any images (radiographs, ultrasound images)
- Describe any additional supporting documents
- Include relevant details that support the case

FORMAT: Plain text only. No markdown.
${NO_META_COMMENTARY}`,
    },
  ];
}

// ============================================================
// REPORT SPECS - CORRECT STRUCTURE
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

CRITICAL: Use plain text only. No markdown.
${NO_META_COMMENTARY}`,
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

CRITICAL: This is for decision-makers who skim. Be concise but comprehensive. No citations here.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'introduction',
      title: '1.0 INTRODUCTION',
      chapterLabel: '',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE INTRODUCTION for this REPORT.

CONTENT REQUIREMENTS:
- Background and context
- Purpose of the report
- Scope of the report
- Methodology (if applicable)

LENGTH: 300-400 words
FORMAT: Plain text only. No markdown.

CRITICAL: NO citations in the introduction - references go at the end.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'findings',
      title: '2.0 FINDINGS / RESULTS',
      chapterLabel: '',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE FINDINGS/RESULTS section.

CRITICAL: Present findings objectively and factually. NO INTERPRETATION.

CONTENT REQUIREMENTS:
- Organized under clear subheadings
- Use tables where numeric data supports the point (see TABLE FORMAT below)
- Present data logically
- Be neutral and factual

LENGTH: 600-900 words
${TABLE_FORMAT_RULE}

CRITICAL RULES:
- This section is NEUTRAL and FACTUAL
- Save opinion/interpretation for Discussion
- If specific numeric data (percentages, case counts, rates) was not provided to you as part of
  the topic/case data, do NOT invent precise figures and present them as real statistics. Either
  use clearly qualitative language (e.g. "coverage remains well below the recommended threshold")
  or explicitly label illustrative figures as such (e.g. "for illustration, a hypothetical scenario
  might show..."). Never present fabricated numbers as though they came from a real data source.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'discussion',
      title: '3.0 DISCUSSION',
      chapterLabel: '',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE DISCUSSION section.

CONTENT REQUIREMENTS:
- What the findings mean
- Implications of the findings
- Limitations of the study/report

LENGTH: 400-600 words
FORMAT: Plain text only. No markdown.

CRITICAL: This is where you interpret the findings from Section 2.0. Do not introduce new
numeric data here that did not appear in Section 2.0.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'recommendations',
      title: '4.0 RECOMMENDATIONS',
      chapterLabel: '',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE RECOMMENDATIONS section.

CONTENT REQUIREMENTS:
- Specific, actionable recommendations
- Tied directly to findings
- Be specific (e.g., "Increase monitoring in Q3" not "Improve monitoring")

LENGTH: 300-400 words
FORMAT: Plain text only. No markdown.

CRITICAL: Recommendations must be SPECIFIC and ACTIONABLE.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'conclusion',
      title: '5.0 CONCLUSION',
      chapterLabel: '',
      chapterNumber: '5',
      instructions: `Write a BRIEF CONCLUSION for this REPORT.

CONTENT REQUIREMENTS:
- Brief close
- No new information
- Tie back to purpose

LENGTH: 100-150 words
FORMAT: Plain text only. No markdown.
${NO_META_COMMENTARY}`,
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
- NO website URLs - use proper APA format

FORMAT: APA 7th edition
CRITICAL: Only include references you are highly confident actually exist. If uncertain, prefer a well-known foundational source over inventing a specific study.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'appendices',
      title: 'APPENDICES',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write a COMPLETE APPENDICES section for this REPORT.

CONTENT REQUIREMENTS:
- Describe any supporting documents
- Describe any raw data or detailed analysis

FORMAT: Plain text only. No markdown.
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
      instructions: `Write ONLY the following front-matter sections for a RESEARCH PROPOSAL:

TITLE PAGE (with the research title, author name, degree, date)
TABLE OF CONTENTS: List all section titles in order. Do NOT include page numbers -
  since chapters are generated independently, exact page numbers cannot be known yet.
LIST OF ABBREVIATIONS AND ACRONYMS

Do NOT write any chapter content yet. Stop after the abbreviations list.
${NO_META_COMMENTARY}
Do NOT ask the reader for permission to continue.

CRITICAL: Use plain text only. No markdown, no asterisks.
CRITICAL: This is a PROPOSAL for research that has NOT yet been conducted. Do not write
an Abstract, and do not state or imply that any data has been collected or any findings
exist - everything here describes what WILL be done, not what WAS done or found.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE Chapter One for a RESEARCH PROPOSAL.

CHAPTER ONE
1.0 INTRODUCTION
[Short paragraph explaining what the chapter covers - NO citations here]

1.1 Background of the Study
[6-8 substantial paragraphs with citations]

1.2 Statement of the Problem
[2-3 substantial paragraphs]

1.3 Research Objectives
1.3.1 General Objective
[One clear sentence stating the overall aim of the proposed study - THIS MUST NOT BE LEFT BLANK OR GENERIC]
1.3.2 Specific Objectives
[3-5 objectives, each a separate numbered statement]

1.4 Research Questions
[3-5 questions, each directly mapped to a specific objective above]

1.5 Significance of the Study
[3-4 paragraphs]

1.6 Scope of Study
[2 paragraphs]

1.7 Operational Definitions
[5-8 key terms]

CRITICAL: Every numbered subsection (1.0 through 1.7) MUST contain real, complete content.
Do not leave any subsection as a heading only or with placeholder text.
CRITICAL: This is a PROPOSAL - use future/conditional tense throughout ("this study will
investigate", "data will be collected"), never past tense as if the research already happened.
Use APA 7th style in-text citations. References go at the end. Use plain text only.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PROPOSAL.

CHAPTER TWO
2.0 INTRODUCTION
[Short paragraph - NO citations here]

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

CRITICAL: This chapter reviews EXISTING literature about the topic - it does not report
any findings from this proposed study, since this study has not been conducted yet.
Use APA 7th style in-text citations. References go at the end. Use plain text only.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PROPOSAL.

CHAPTER THREE
3.0 INTRODUCTION
[Short paragraph - NO citations here]

3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sample Size
[Show the actual formula used (e.g. Yamane's or Cochran's) with the calculation worked through,
not just a final number with no derivation]
3.6 Data Collection Instruments and Procedures
3.7 Data Analysis Plan
3.8 Reliability and Validity
3.9 Ethical Considerations

CRITICAL: Use future/conditional tense throughout - this describes what WILL be done.
CRITICAL: Cite Creswell. References go at the end. Use plain text only.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following sections:

REFERENCES
Provide 30 complete APA 7th references. NO website URLs. Use proper APA format.
CRITICAL: Only include references you are highly confident actually exist. If uncertain
whether a specific paper exists, prefer a well-known foundational text over inventing one.

WORK PLAN
Month 1-2: Literature Review
Month 3: Instrument Development
Month 4-5: Data Collection
Month 6: Data Analysis
Month 7: Report Writing
Month 8: Revision and Submission

BUDGET
${TABLE_FORMAT_RULE}
Present the budget as a properly formed markdown pipe table with these rows:
| Item | Quantity | Unit Cost (ZMW) | Total (ZMW) |
|------|----------|------------------|-------------|
| Stationery | 1 set | 2,000 | 2,000 |
| Internet Data | 6 months | 500 | 3,000 |
| Assistant Allowance | 2 assistants | 3,000 | 6,000 |
| Transport | 6 months | 1,500 | 9,000 |
| Printing | 400 copies | 2 | 800 |
| Equipment | 2 devices | 1,500 | 3,000 |
| Software | 1 license | 2,000 | 2,000 |
| Contingency | 10% |  | 2,580 |
| TOTAL |  |  | 28,380 |

APPENDICES
APPENDIX A: STUDENT QUESTIONNAIRE
APPENDIX B: SEMI-STRUCTURED INTERVIEW GUIDE
APPENDIX C: INFORMED CONSENT FORM
APPENDIX D: INTRODUCTORY LETTER
${NO_META_COMMENTARY}`,
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

CRITICAL: Use plain text only. No markdown, no asterisks.
${NO_META_COMMENTARY}
Do NOT ask the reader for permission to continue.`,
    },
    {
      id: 'chapter1',
      title: 'CHAPTER ONE: INTRODUCTION',
      chapterLabel: 'CHAPTER ONE',
      chapterNumber: '1',
      instructions: `Write a COMPREHENSIVE Chapter One for a RESEARCH PAPER.

CHAPTER ONE
1.0 Introduction
[1 paragraph explaining what the chapter covers - NO citations here]

1.1 Background of the Study
[6-8 substantial paragraphs with citations]

1.2 Statement of the Problem
[2-3 substantial paragraphs with citations]

1.3 Research Objectives
1.3.1 General Objective
[One clear sentence stating the overall aim of the study - THIS MUST NOT BE LEFT BLANK OR GENERIC]
1.3.2 Specific Objectives
[3-5 specific, measurable objectives, each as a separate numbered statement]

1.4 Research Questions
[3-5 questions, each directly mapped to a specific objective above]

1.5 Significance of the Study
[3-4 paragraphs explaining who benefits and how]

1.6 Scope of Study
[2 paragraphs defining geographic, population, and topical boundaries]

1.7 Operational Definitions
[5-8 key terms, each with a working definition specific to this study]

CRITICAL: Every numbered subsection (1.0 through 1.7) MUST contain real, complete content.
Do not leave any subsection as a heading only or with placeholder text.
Use APA 7th style in-text citations. References go at the end. Use plain text only.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PAPER.

CHAPTER TWO
2.0 Introduction
[Short paragraph - NO citations here]
2.1 Empirical Review
2.2 Theoretical Framework
2.3 Conceptual Framework

CRITICAL: Use APA 7th style in-text citations. References go at the end. Use plain text only.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PAPER.

CHAPTER THREE
3.0 Introduction
[Short paragraph - NO citations here]
3.1 Research Approach
3.2 Research Design
3.3 Study Location
3.4 Target Population
3.5 Sample Size
[Show the actual formula used with the calculation worked through, not just a final number]
3.6 Data Collection Instruments and Procedures
3.7 Data Analysis Plan
3.8 Reliability and Validity
3.9 Ethical Considerations

CRITICAL: Cite Creswell. References go at the end. Use plain text only.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter4',
      title: 'CHAPTER FOUR: PRESENTATION OF FINDINGS',
      chapterLabel: 'CHAPTER FOUR',
      chapterNumber: '4',
      instructions: `Write a COMPREHENSIVE Chapter Four for a RESEARCH PAPER.

CHAPTER FOUR
4.0 Introduction
[Short paragraph]
4.1 Descriptive and Demographic Results
4.2 Key Thematic or Statistical Findings
4.3 Summary of Findings

${TABLE_FORMAT_RULE}

CRITICAL: If specific numeric data was not provided to you as part of the topic, do NOT
invent precise figures and present them as real study results. Use clearly qualitative or
illustrative framing instead of fabricated statistics.
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter5',
      title: 'CHAPTER FIVE: DISCUSSION',
      chapterLabel: 'CHAPTER FIVE',
      chapterNumber: '5',
      instructions: `Write a COMPREHENSIVE Chapter Five for a RESEARCH PAPER.

CHAPTER FIVE
5.0 Introduction
[Short paragraph]
5.1 Interpretation of Key Findings
5.2 Comparison with Previous Studies
5.3 Implications for Practice and Policy
5.4 Limitations of the Study
${NO_META_COMMENTARY}`,
    },
    {
      id: 'chapter6',
      title: 'CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS',
      chapterLabel: 'CHAPTER SIX',
      chapterNumber: '6',
      instructions: `Write a COMPREHENSIVE Chapter Six for a RESEARCH PAPER.

CHAPTER SIX
6.0 Introduction
[Short paragraph]
6.1 Conclusions
6.2 Recommendations
${NO_META_COMMENTARY}`,
    },
    {
      id: 'references',
      title: 'REFERENCES',
      chapterLabel: 'REFERENCES',
      chapterNumber: '',
      instructions: `Write ONLY the following:

REFERENCES
Provide 30 complete APA 7th references. NO website URLs. Use proper APA format.
CRITICAL: Only include references you are highly confident actually exist.

APPENDICES
APPENDIX A: DATA EXTRACTION TOOL
APPENDIX B: PARTICIPANT INFORMATION SHEET AND INFORMED CONSENT
${NO_META_COMMENTARY}`,
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
      error: `All providers failed: Gemini (${gemini.error}), Groq (${groq.error}), OpenRouter (${openRouter.error}), Cerebras (${cerebras.error}), You.com (${youCom.error})`,
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
    error: `All providers failed: Groq (${groq.error}), OpenRouter (${openRouter.error}), Gemini (${gemini.error}), Cerebras (${cerebras.error}), You.com (${youCom.error})`,
  };
}

// Only strip markdown emphasis/heading syntax - table pipe syntax is now allowed
// and must survive this cleaning step so it can be rendered as a real table downstream.
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

    // Guard against an unrecognized document type silently falling through to
    // the research-paper default (this was likely why "Research Proposal" in
    // your UI produced a Research Paper with fabricated findings - if the
    // frontend ever sends an unexpected `type` value, this will now surface
    // as a clear 400 error instead of silently generating the wrong document).
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
        { error: `Invalid chapterIndex ${chapterIndex}. This document type has ${chapters.length} chapters (0-${chapters.length - 1}).` },
        { status: 400 }
      );
    }

    const idx = chapterIndex;
    const chapter = chapters[idx];

    let depthInstruction = `
CRITICAL DEPTH REQUIREMENT:
This is a ${levelInfo.label} academic document. The content must be COMPREHENSIVE and THOROUGH.
- Write SUBSTANTIAL paragraphs (minimum 5-7 sentences per paragraph)
- Provide detailed analysis, not brief summaries
- Include specific examples, statistics, and evidence
- The document should reflect ${levelInfo.depth}
- Do not be brief or superficial - this is a serious academic work
`;

    let documentTypeInstruction = '';

    if (type === 'essay') {
      documentTypeInstruction = `
THIS IS AN ASSIGNMENT - NOT A RESEARCH PAPER.

STRUCTURE (IN ORDER):
1. TITLE PAGE (NO citations)
2. 1.0 INTRODUCTION (2-3 paragraphs, 300-400 words max, NO citations)
3. 2.0 MAIN BODY (6-10 paragraphs, 1000-1500 words, WITH citations)
4. 3.0 CONCLUSION (2-3 paragraphs, 200-300 words, NO new citations)
5. 4.0 REFERENCES (12-20 APA 7th references, NO website URLs)

CRITICAL RULES:
- NO references in the Introduction or Conclusion
- References ONLY in the Main Body and the Reference List
- NO website URLs in references - use proper APA format
- Introduction should be concise (max 400 words)
- Total length: ${levelInfo.pageCount}`;
    } else if (type === 'report') {
      documentTypeInstruction = `
THIS IS A REPORT - NOT A RESEARCH PAPER.

STRUCTURE (IN ORDER):
1. TITLE PAGE
2. EXECUTIVE SUMMARY (150-200 words, NO citations)
3. 1.0 INTRODUCTION (300-400 words, NO citations)
4. 2.0 FINDINGS/RESULTS (600-900 words, WITH citations as needed)
5. 3.0 DISCUSSION (400-600 words, WITH citations)
6. 4.0 RECOMMENDATIONS (300-400 words, WITH citations)
7. 5.0 CONCLUSION (100-150 words, NO citations)
8. 6.0 REFERENCES (12-20 APA 7th references)
9. APPENDICES

CRITICAL: NO citations in Introduction or Conclusion. NO website URLs.`;
    } else if (type === 'case-study') {
      documentTypeInstruction = `
THIS IS A CASE STUDY - Should be as long as a research paper.

STRUCTURE (IN ORDER):
1. FRONT MATTER (Title Page, Table of Contents, List of Abbreviations)
2. CHAPTER ONE: INTRODUCTION (300-400 words, NO citations)
3. CHAPTER TWO: CASE PRESENTATION (500-700 words, NO citations - FACTS ONLY)
4. CHAPTER THREE: DISCUSSION AND ANALYSIS (800-1200 words, WITH citations - CORE SECTION)
5. CHAPTER FOUR: MANAGEMENT AND OUTCOME (400-600 words, WITH citations)
6. CHAPTER FIVE: CONCLUSION (200-300 words, NO citations)
7. REFERENCES (12-20 APA 7th references, NO website URLs)
8. APPENDICES

CRITICAL RULES:
- Chapter Two = FACTS ONLY, NO interpretation, NO citations
- Chapter Three = differential diagnosis and literature comparison ONLY, WITH citations. Do NOT discuss treatment rationale here.
- Chapter Four = the ONLY place treatment rationale belongs
- NO citations in Introduction or Conclusion
- NO website URLs in references
- Use CHAPTER format like a research paper

TOTAL LENGTH: ${levelInfo.pageCount}`;
    } else if (type === 'proposal') {
      documentTypeInstruction = `
THIS IS A RESEARCH PROPOSAL - NOT A COMPLETED RESEARCH PAPER.
STRUCTURE (IN ORDER): CHAPTER ONE (with 1.0-1.7), CHAPTER TWO (with 2.0-2.3), CHAPTER THREE (with 3.0-3.9), REFERENCES, WORK PLAN, BUDGET, APPENDICES.

CRITICAL: No research has been conducted yet. Use future/conditional tense throughout
("this study will investigate", "data will be collected") - NEVER past tense as if
findings already exist. Do NOT include a Declaration, Dedication, Acknowledgements, or
Abstract - those belong to a completed research paper, not a proposal.
NO citations in Introduction sections. References only in body and reference list. NO website URLs.`;
    } else {
      documentTypeInstruction = `
THIS IS A RESEARCH PAPER (Full Dissertation).
STRUCTURE (IN ORDER): FRONT MATTER, CHAPTER ONE, CHAPTER TWO, CHAPTER THREE, CHAPTER FOUR, CHAPTER FIVE, CHAPTER SIX, REFERENCES, APPENDICES.

CRITICAL: NO citations in Introduction sections. References only in body and reference list. NO website URLs.`;
    }

    let chapterSpecificInstruction = '';

    if (type === 'proposal') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER ONE SPECIFICS:
- 1.0 Introduction: 1-2 paragraphs, NO citations
- 1.1 Background: 6-8 substantial paragraphs WITH citations
- 1.2 Statement of Problem: 2-3 substantial paragraphs WITH citations
- 1.3.1 General Objective: one full sentence, must not be blank
- 1.3.2 Specific Objectives: 3-5 objectives
- 1.4 Research Questions: 3-5 questions
- 1.5 Significance: 3-4 paragraphs
- 1.6 Scope: 2 paragraphs
- 1.7 Operational Definitions: 5-8 terms`;
      }

      if (chapter.id === 'chapter2') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER TWO SPECIFICS:
- 2.0 Introduction: 1 paragraph, NO citations
- 2.1.0 Empirical Review: 150-200 words, NO citations
- 2.1.1, 2.1.2, 2.1.3: Each 4-5 substantial paragraphs WITH citations
- 2.2 Theoretical Framework: 5-6 paragraphs WITH citations`;
      }

      if (chapter.id === 'chapter3') {
        chapterSpecificInstruction = `
PROPOSAL CHAPTER THREE SPECIFICS:
- 3.0 Introduction: 1 paragraph, NO citations
- 3.2 Research Design: cite Creswell
- 3.5 Sample Size: Show formula and worked calculation
- 3.6 Data Collection: cite sources
- 3.7 Data Analysis: justify, cite`;
      }
    } else if (type === 'research') {
      if (chapter.id === 'chapter1') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER ONE SPECIFICS:
- 1.0 Introduction: 1 paragraph, NO citations
- 1.1 Background: 6-8 substantial paragraphs WITH citations
- 1.2 Statement of Problem: 2-3 substantial paragraphs WITH citations
- 1.3.1 General Objective: one full sentence, must not be blank
- 1.3.2 Specific Objectives: 3-5 objectives
- 1.4 Research Questions: 3-5 questions
- 1.5 Significance: 3-4 paragraphs
- 1.6 Scope: 2 paragraphs
- 1.7 Operational Definitions: 5-8 terms`;
      }

      if (chapter.id === 'chapter6') {
        chapterSpecificInstruction = `
RESEARCH CHAPTER SIX SPECIFICS:
- 6.0 Introduction: 1 paragraph, NO citations
- 6.1 Conclusions: 4-6 substantial paragraphs, NO new citations
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
- This is a ${typeLabel} - follow the correct structure.
- Start with the section heading exactly as specified.
- Write SUBSTANTIAL, DETAILED content - never brief or superficial.
- Use APA 7th style in-text citations throughout the BODY only.
- NO citations in Introduction, Conclusion, or Executive Summary.
- NO website URLs in references - use proper APA format (Author, Year, Title, Publisher/Journal).
- Never use numbered bracket citations like [1].
- Use plain text only. No markdown, no asterisks, no underscores, EXCEPT for well-formed
  pipe tables when presenting numeric data (see TABLE FORMAT instructions if provided above).
- Avoid the use of hyphens or dashes throughout.
- Write out full content. Never use placeholders.
- Never include conversational meta-commentary, permission-asking, or process narration.
  Output ONLY the requested document content.
- The document must demonstrate ${levelInfo.depth} academic writing.`;

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
