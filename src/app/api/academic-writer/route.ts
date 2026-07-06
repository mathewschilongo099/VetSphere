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

async function callGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return '';

  try {
    const response = await fetch(
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
      }
    );
    const data = await response.json();
    if (data.error) {
      console.error('Gemini error:', data.error);
      return '';
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (e) {
    console.error('Gemini fetch error:', e);
    return '';
  }
}

async function callOpenRouter(prompt: string, maxTokens: number): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return '';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.BASE_URL || 'http://localhost:3000',
        'X-Title': 'VetSphere Academic Writer',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.45,
        max_tokens: maxTokens,
      }),
    });
    const data = await response.json();
    if (data.error || !data.choices) return '';
    return data.choices[0]?.message?.content || '';
  } catch (e) {
    console.error('OpenRouter error:', e);
    return '';
  }
}

async function generateSection(
  sectionPrompt: string,
  maxOutputTokens: number
): Promise<{ text: string; apiUsed: string }> {
  let text = await callGemini(sectionPrompt, maxOutputTokens);
  if (text) return { text, apiUsed: 'Gemini' };

  text = await callOpenRouter(sectionPrompt, maxOutputTokens);
  if (text) return { text, apiUsed: 'OpenRouter' };

  return { text: '', apiUsed: 'none' };
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`/g, '')
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

  // Rolling context so each chapter stays consistent with what came before
  // (objectives raised in Ch.1 get answered in Ch.4-6, etc.) without resending
  // the full paper every time (which would blow up token usage).
  let rollingSummary = `Research paper topic: "${topic}". Academic level: ${levelInfo.label}.`;

  for (const chapter of chapters) {
    const prompt = `You are an expert veterinary academic writer producing a ${levelInfo.depth} research paper section for ${levelInfo.label} (target overall length ${levelInfo.pageCount}).

TOPIC: "${topic}"

CONTEXT SO FAR: ${rollingSummary}

TASK: ${chapter.instructions}

STYLE RULES (must follow strictly):
- Simple, formal academic English. No slang, emojis, or informal language.
- One idea per paragraph. Avoid long unbroken blocks of text.
- Use clear numbered headings and subheadings exactly as specified above.
- Do not repeat content already covered in earlier chapters (see context above).
- Do not include any chapter other than the one requested.
- Do not add a preamble like "Here is the chapter" — output only the section content itself, starting directly with the numbered heading.`;

    const { text, apiUsed } = await generateSection(prompt, 8000);
    apiUsedList.push(`${chapter.id}: ${apiUsed}`);

    if (text) {
      generatedParts.push(cleanText(text));
      // Keep the rolling context short: summarise what this chapter covered.
      rollingSummary += ` ${chapter.title} has been written, covering: ${chapter.instructions
        .split('\n')[0]
        .slice(0, 200)}...`;
    } else {
      generatedParts.push(
        `${chapter.title}\n\n[This section could not be generated — please retry or check API configuration.]`
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

  const { text, apiUsed } = await generateSection(prompt, 8000);
  return { content: text ? cleanText(text) : '', apiUsed };
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
