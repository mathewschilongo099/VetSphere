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
// PROPOSAL SPECS
// ============================================================
function buildProposalSpecs(topic: string): ChapterSpec[] {
  return [
    {
      id: 'frontmatter',
      title: 'FRONT MATTER',
      chapterLabel: '',
      chapterNumber: '',
      instructions: `Write ONLY the following front-matter sections for a RESEARCH PROPOSAL, in this order:

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

CRITICAL FORMAT - COPY THIS EXACT STRUCTURE:

CHAPTER ONE
1.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers]

1.1 Background of the Study
[Write 6 substantial paragraphs, each 6-8 sentences. Cover global, regional, and national context. Mention different countries as examples. Cite with references from the last 10 years.]

1.2 Statement of the Problem
[Write 1 paragraph of approximately 100 words. Be convincing. Cite as evidence.]

1.3 Research Objectives
The following objectives guide this investigation:
1.3.1 General Objective
[Write 20 to 25 words]
1.3.2 Specific Objectives
1. [First specific objective - write a clear, measurable objective]
2. [Second specific objective]
3. [Third specific objective]

1.4 Research Questions
To address the objectives, the study seeks to answer the following questions:
1. [First research question - directly corresponds to objective 1]
2. [Second research question - directly corresponds to objective 2]
3. [Third research question - directly corresponds to objective 3]

1.5 Significance of the Study
[Write 2-3 substantial paragraphs]

1.6 Scope of Study
[Write 1 paragraph of approximately 60 words]

1.7 Operational Definitions
[Define exactly 5 key terms with 2-3 sentences each]

CRITICAL RULES:
- You MUST write EXACTLY 3 specific objectives and EXACTLY 3 research questions.
- You MUST include the introductory sentences "The following objectives guide this investigation:" and "To address the objectives, the study seeks to answer the following questions:"
- Each subsection must have SUBSTANTIAL content.
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter2',
      title: 'CHAPTER TWO: LITERATURE REVIEW',
      chapterLabel: 'CHAPTER TWO',
      chapterNumber: '2',
      instructions: `Write a COMPREHENSIVE Chapter Two for a RESEARCH PROPOSAL.

CRITICAL FORMAT - COPY THIS EXACT STRUCTURE:

CHAPTER TWO
2.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers]

2.1.0 Empirical Review
[Write exactly 100 words with NO citations]

2.1.1 [Theme from Objective 1]
[Write 3-4 substantial paragraphs with APA citations]

2.1.2 [Theme from Objective 2]
[Write 3-4 substantial paragraphs with APA citations]

2.1.3 [Theme from Objective 3]
[Write 3-4 substantial paragraphs with APA citations]

2.2 Theoretical Framework
[Write 4-5 substantial paragraphs using exactly 2 different theories]

2.3 Conceptual Framework
[Write a substantial explanation showing the relationship between variables, followed by a description of the conceptual framework sketch]

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
- Use APA 7th style in-text citations.
- Use plain text only.`,
    },
    {
      id: 'chapter3',
      title: 'CHAPTER THREE: RESEARCH METHODOLOGY',
      chapterLabel: 'CHAPTER THREE',
      chapterNumber: '3',
      instructions: `Write a COMPREHENSIVE Chapter Three for a RESEARCH PROPOSAL.

CRITICAL FORMAT - COPY THIS EXACT STRUCTURE:

CHAPTER THREE
3.0 INTRODUCTION
[Write a short paragraph explaining what the chapter covers]

3.1 Research Approach
[Write 60 words exactly]

3.2 Research Design
[Write 90 words exactly, cite Creswell, justify the design choice]

3.3 Study Location
[Write 60 words exactly]

3.4 Target Population
[Write 60 words exactly, state the actual population]

3.5 Sample Size
[Show using a formula how the sample was calculated, justify the sample size]

3.6 Data Collection Instruments and Procedures
[Write 100 words exactly, ensure to cite]

3.7 Data Analysis Plan
[Write 90 words exactly, be clear, consistent, justify, cite]

3.8 Reliability and Validity
[Write 60 words exactly]

3.9 Ethical Considerations
[Write 90 words exactly]

CRITICAL RULES:
- Each subsection must have SUBSTANTIAL content.
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

INSTRUCTIONS: Please answer all questions honestly. Your responses are confidential.

SECTION A: DEMOGRAPHIC INFORMATION
A1. Age: ( ) 18-20 ( ) 21-25 ( ) 26-30 ( ) 31+
A2. Gender: ( ) Male ( ) Female ( ) Prefer not to say
A3. Year of Study: ( ) 1st ( ) 2nd ( ) 3rd ( ) 4th
A4. Faculty: ( ) Humanities ( ) Sciences ( ) Engineering ( ) Business ( ) Education
A5. Residence: ( ) On-campus ( ) Off-campus ( ) With family

SECTION B: SOCIOECONOMIC STATUS
B1. Monthly budget for academic expenses: ( ) Below 500 ZMW ( ) 500-1000 ZMW ( ) 1001-2000 ZMW ( ) Above 2000 ZMW
B2. Primary source of financial support: ( ) Parents/Guardians ( ) Government Bursary ( ) Scholarship ( ) Part-time Work ( ) Other
B3. Employment status: ( ) Full-time ( ) Part-time ( ) Unemployed
B4. Household income: ( ) Below 3,000 ZMW ( ) 3,001-5,000 ZMW ( ) 5,001-10,000 ZMW ( ) Above 10,000 ZMW

SECTION C: INFORMATION RESOURCE ACCESS
C1. Do you own a personal laptop? ( ) Yes ( ) No
C2. Do you own a smartphone? ( ) Yes ( ) No
C3. How often do you access the internet for academic purposes? ( ) Daily ( ) Several times a week ( ) Once a week ( ) Rarely ( ) Never
C4. What is your primary method of accessing the internet? ( ) Mobile data ( ) University Wi-Fi ( ) Public Wi-Fi ( ) Cybercafe
C5. Please rate the following barriers: (Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree)
- Cost of internet data is too high
- I cannot afford a personal laptop
- Electricity outages affect my studies
- Library has limited computers
- Library operating hours are insufficient

SECTION D: ACADEMIC IMPACT
D1. Limited access to information resources affects my ability to: (Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree)
- Complete assignments on time
- Conduct thorough research
- Participate in online learning
- Collaborate with peers on group work
- Access current journal articles

D2. How would you describe your academic performance compared to peers with better information access? ( ) Significantly better ( ) Slightly better ( ) About the same ( ) Slightly worse ( ) Significantly worse
D3. Have you ever missed an assignment deadline due to information access challenges? ( ) Yes, frequently ( ) Yes, sometimes ( ) Rarely ( ) Never

SECTION E: COPING STRATEGIES
E1. What strategies do you use to overcome access challenges? (Tick all that apply)
( ) Share data bundles with friends
( ) Use university computer labs
( ) Rely on printed textbooks
( ) Visit internet cafes
( ) Study in groups
( ) Use free Wi-Fi hotspots
( ) Wake up early for faster internet
( ) Other

E2. How effective are these strategies? ( ) Very effective ( ) Somewhat effective ( ) Not effective
E3. Have you ever considered dropping out due to financial constraints? ( ) Yes ( ) No

APPENDIX B: SEMI-STRUCTURED INTERVIEW GUIDE

INTRODUCTION: Thank you for agreeing to participate in this interview. Your responses are confidential and will be used only for academic purposes. This interview will take approximately 30 minutes.

SECTION 1: BACKGROUND AND DEMOGRAPHICS
1. Can you tell me about yourself, including your year of study and faculty?
2. How would you describe your financial situation as a student?
3. What is your primary source of funding for your studies?
4. Do you work part-time while studying? If so, how does this affect your academic work?

SECTION 2: INFORMATION ACCESS CHALLENGES
5. Can you describe your typical experience in accessing information resources for your academic work?
6. What specific challenges do you face in accessing internet connectivity for your studies?
7. What challenges do you face regarding access to personal computing devices such as laptops or smartphones?
8. How does electricity supply affect your ability to study and access information resources?
9. Tell me about your experience using the university library and computer labs. What challenges have you encountered?

SECTION 3: IMPACT OF POVERTY ON ACADEMIC WORK
10. How does your financial situation affect your ability to access the information resources you need?
11. What trade-offs do you have to make between academic expenses and other basic needs?
12. How does your living situation affect your access to information resources?
13. Do you feel that your socioeconomic background puts you at a disadvantage compared to other students?
14. How do information access challenges affect your academic performance and overall educational experience?

SECTION 4: COPING MECHANISMS AND SUPPORT SYSTEMS
15. What strategies do you use to cope with information access challenges?
16. How do you feel about the support provided by the university to help students access information resources?
17. Have you ever used the university's financial aid or support services? If so, how was your experience?

SECTION 5: RECOMMENDATIONS
18. What recommendations would you offer to the university to improve information resource access for students?
19. What recommendations would you offer to the government to support students from low-income backgrounds?
20. Is there anything else you would like to share about your experience with information resource access at the University of Zambia?

CLOSING: Thank you for your time and valuable insights.

APPENDIX C: INFORMED CONSENT FORM

STUDY TITLE: Poverty and Information Resource Access Among University Students: A Case Study of the University of Zambia

PRINCIPAL INVESTIGATOR: [Researcher Name]

INSTITUTION: University of Zambia

PURPOSE OF THE STUDY
You are invited to participate in a research study investigating the relationship between poverty and information resource access among University of Zambia students. The study aims to understand the challenges students face in accessing academic information resources and how these challenges affect academic performance.

PROCEDURES
If you agree to participate, you will be asked to complete a questionnaire or participate in an interview. The questionnaire will take approximately 15 to 20 minutes to complete. The interview will take approximately 30 to 45 minutes and will be audio recorded with your permission.

VOLUNTARY PARTICIPATION
Your participation in this study is entirely voluntary. You may choose not to participate or withdraw from the study at any time without any penalty or loss of benefits.

CONFIDENTIALITY
All information collected during this study will be kept strictly confidential. Your name will not appear in any reports or publications resulting from this study. Data will be stored securely and accessible only to the research team.

RISKS AND BENEFITS
There are no anticipated risks associated with participation in this study. While you may not receive direct benefits from participating, your responses will contribute to a better understanding of information resource access challenges and may inform policy improvements.

CONTACT INFORMATION
If you have any questions about this study, please contact the principal investigator at [email address] or the University of Zambia Research Ethics Committee.

CONSENT STATEMENT
I have read the above information and understand the purpose and procedures of this study. I voluntarily agree to participate.

Participant's Name: _______________________________________
Participant's Signature: ___________________________________
Date: ___________________

APPENDIX D: INTRODUCTORY LETTER

[Date]

The Director
University of Zambia
Great East Road Campus
Lusaka, Zambia

Dear Sir/Madam,

RE: REQUEST FOR PERMISSION TO CONDUCT RESEARCH AT THE UNIVERSITY OF ZAMBIA

I am [Researcher Name], a student at the University of Zambia pursuing a Master's Degree in [Program Name]. I am conducting research on "Poverty and Information Resource Access Among University Students: A Case Study of the University of Zambia."

The purpose of this study is to investigate the relationship between poverty and access to information resources among students. The study aims to identify the challenges students face in accessing academic resources and propose strategies to address these challenges.

I kindly request permission to collect data from undergraduate students at the University of Zambia. Data collection will involve administering questionnaires and conducting interviews with willing participants. All data collected will be treated with strict confidentiality and used solely for academic purposes.

I have obtained ethical clearance from the University of Zambia Research Ethics Committee. I assure you that the research will be conducted in accordance with ethical guidelines and that participants' rights and privacy will be protected.

I look forward to your favourable consideration of this request.

Yours sincerely,

[Researcher Name]
[Student Number]
[Contact Information]

CRITICAL: All appendices must contain ACTUAL content as shown above. Write out all questions, response options, and consent text in full. Be comprehensive and detailed.`,
    },
  ];
}
