// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ... (all existing imports, constants, levelMap, typeLabels remain the same) ...

// ============================================================
// PPTX CONTENT GENERATOR (AI-Powered)
// ============================================================
async function generatePptxContent(content: string, topic: string, level: string): Promise<{ slides: any[]; apiUsed: string; error: string }> {
  // Extract key sections from the content to create focused prompts
  const abstractMatch = content.match(/ABSTRACT\s*([\s\S]*?)(?=\n\n[A-Z]|$)/i);
  const introMatch = content.match(/1\.0\s+INTRODUCTION\s*([\s\S]*?)(?=\n1\.1\s+)/i);
  const backgroundMatch = content.match(/1\.1\s+BACKGROUND OF THE STUDY\s*([\s\S]*?)(?=\n1\.2\s+)/i);
  const problemMatch = content.match(/1\.2\s+STATEMENT OF THE PROBLEM\s*([\s\S]*?)(?=\n1\.3\s+)/i);
  const objectivesMatch = content.match(/1\.3\s+RESEARCH OBJECTIVES\s*([\s\S]*?)(?=\n1\.4\s+)/i);
  const questionsMatch = content.match(/1\.4\s+RESEARCH QUESTIONS\s*([\s\S]*?)(?=\n1\.5\s+)/i);
  const litReviewMatch = content.match(/2\.0\s+LITERATURE REVIEW\s*([\s\S]*?)(?=\n3\.0\s+)/i);
  const methodologyMatch = content.match(/3\.0\s+RESEARCH METHODOLOGY\s*([\s\S]*?)(?=\n4\.0\s+)/i);
  const findingsMatch = content.match(/4\.0\s+PRESENTATION OF FINDINGS\s*([\s\S]*?)(?=\n5\.0\s+)/i);
  const discussionMatch = content.match(/5\.0\s+DISCUSSION\s*([\s\S]*?)(?=\n6\.0\s+)/i);
  const conclusionsMatch = content.match(/6\.0\s+CONCLUSIONS AND RECOMMENDATIONS\s*([\s\S]*?)(?=\nREFERENCES|$)/i);
  const referencesMatch = content.match(/REFERENCES\s*([\s\S]*?)(?=\nAPPENDICES|$)/i);

  const abstract = abstractMatch ? abstractMatch[1].trim() : '';
  const introduction = introMatch ? introMatch[1].trim() : '';
  const background = backgroundMatch ? backgroundMatch[1].trim() : '';
  const problem = problemMatch ? problemMatch[1].trim() : '';
  const objectives = objectivesMatch ? objectivesMatch[1].trim() : '';
  const questions = questionsMatch ? questionsMatch[1].trim() : '';
  const litReview = litReviewMatch ? litReviewMatch[1].trim() : '';
  const methodology = methodologyMatch ? methodologyMatch[1].trim() : '';
  const findings = findingsMatch ? findingsMatch[1].trim() : '';
  const discussion = discussionMatch ? discussionMatch[1].trim() : '';
  const conclusions = conclusionsMatch ? conclusionsMatch[1].trim() : '';
  const references = referencesMatch ? referencesMatch[1].trim() : '';

  const prompt = `You are a professional presentation designer. Based on the following research paper content, create a comprehensive PowerPoint presentation with 16-20 clear, concise slides.

TOPIC: "${topic}"
ACADEMIC LEVEL: ${level}

CONTENT EXTRACTS:
- Abstract: ${abstract.slice(0, 1000)}
- Introduction: ${introduction.slice(0, 800)}
- Background: ${background.slice(0, 800)}
- Problem Statement: ${problem.slice(0, 500)}
- Objectives: ${objectives.slice(0, 500)}
- Research Questions: ${questions.slice(0, 500)}
- Literature Review: ${litReview.slice(0, 800)}
- Methodology: ${methodology.slice(0, 800)}
- Findings: ${findings.slice(0, 800)}
- Discussion: ${discussion.slice(0, 800)}
- Conclusions: ${conclusions.slice(0, 800)}
- References: ${references.slice(0, 500)}

CREATE A PRESENTATION WITH THESE SLIDES (each slide must have a title and 3-6 bullet points):

Slide 1: Title Slide (title, author, date, institution)
Slide 2: Presentation Outline (list all section titles)
Slide 3: Introduction and Background
Slide 4: Problem Statement
Slide 5: Research Objectives
Slide 6: Research Questions
Slide 7: Literature Review Overview
Slide 8: Theoretical Framework
Slide 9: Research Methodology
Slide 10: Research Design and Approach
Slide 11: Key Findings - Part 1
Slide 12: Key Findings - Part 2
Slide 13: Discussion Highlights
Slide 14: Conclusions
Slide 15: Recommendations
Slide 16: References
Slide 17: Thank You / Q&A

For each slide, format as:

SLIDE: [Slide Number]
TITLE: [Slide Title]
BULLETS:
- [Bullet point 1 - concise, impactful]
- [Bullet point 2]
- [Bullet point 3]
- [Bullet point 4-6 as needed]

Keep bullet points concise (5-10 words each) and professional. Use clear, academic language.

OUTPUT ALL 17 SLIDES COMPLETE.`;

  // Try each provider in order
  const groq = await callGroq(prompt, 6000);
  if (groq.text) {
    const slides = parseSlides(groq.text);
    if (slides.length >= 10) return { slides, apiUsed: 'Groq', error: '' };
  }

  const openRouter = await callOpenRouter(prompt, 6000);
  if (openRouter.text) {
    const slides = parseSlides(openRouter.text);
    if (slides.length >= 10) return { slides, apiUsed: 'OpenRouter', error: '' };
  }

  const gemini = await callGemini(prompt, 6000);
  if (gemini.text) {
    const slides = parseSlides(gemini.text);
    if (slides.length >= 10) return { slides, apiUsed: 'Gemini', error: '' };
  }

  const cerebras = await callCerebras(prompt, 6000);
  if (cerebras.text) {
    const slides = parseSlides(cerebras.text);
    if (slides.length >= 10) return { slides, apiUsed: 'Cerebras', error: '' };
  }

  return { slides: [], apiUsed: 'none', error: 'All providers failed to generate slides' };
}

function parseSlides(text: string): any[] {
  const slides: any[] = [];
  const lines = text.split('\n');
  let currentSlide: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toUpperCase().startsWith('SLIDE:')) {
      if (currentSlide && currentSlide.bullets && currentSlide.bullets.length > 0) {
        slides.push(currentSlide);
      }
      const numberMatch = trimmed.match(/SLIDE:\s*(\d+)/i);
      currentSlide = {
        number: numberMatch ? parseInt(numberMatch[1]) : slides.length + 1,
        title: '',
        bullets: [],
      };
    } else if (trimmed.toUpperCase().startsWith('TITLE:')) {
      if (currentSlide) {
        currentSlide.title = trimmed.replace(/TITLE:\s*/i, '').trim();
      }
    } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (currentSlide) {
        const bullet = trimmed.replace(/^[-•]\s*/, '').trim();
        if (bullet.length > 2) {
          currentSlide.bullets.push(bullet);
        }
      }
    } else if (trimmed && !trimmed.toUpperCase().startsWith('SLIDE:') && currentSlide) {
      // If there's text without a marker, try to add it as a bullet
      if (trimmed.length > 3 && trimmed.length < 100) {
        currentSlide.bullets.push(trimmed);
      }
    }
  }

  // Push the last slide
  if (currentSlide && currentSlide.bullets && currentSlide.bullets.length > 0) {
    slides.push(currentSlide);
  }

  return slides;
}

// ============================================================
// PPTX GENERATOR (Creates actual PowerPoint file)
// ============================================================
async function generatePptxFile(slidesData: any[], topic: string, level: string): Promise<{ buffer: Buffer; apiUsed: string; error: string }> {
  try {
    const pptx = new pptxgen();

    pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
    pptx.layout = 'WIDE';
    pptx.author = 'VetSphere Academic Writer';
    pptx.title = topic;
    pptx.subject = level;

    const colors = {
      primary: '0B5CFF',
      secondary: '003399',
      accent: 'FF6B35',
      text: '1A1A2E',
      lightText: '666666',
      white: 'FFFFFF',
      background: 'F8F9FA',
    };

    // Slide 1: Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: colors.primary };
    titleSlide.addText(topic.toUpperCase(), {
      x: 0.5, y: 1.5, w: 12.33, h: 2,
      fontSize: 36, fontFace: 'Arial', color: colors.white, align: 'center', bold: true,
    });
    titleSlide.addText('Research Presentation', {
      x: 0.5, y: 3.8, w: 12.33, h: 0.8,
      fontSize: 24, fontFace: 'Arial', color: colors.white, align: 'center', italic: true,
    });
    titleSlide.addText(`VetSphere Academic Writer • ${level} • ${new Date().toLocaleDateString()}`, {
      x: 0.5, y: 5.5, w: 12.33, h: 0.6,
      fontSize: 16, fontFace: 'Arial', color: colors.white, align: 'center',
    });

    // Slide 2: Outline
    const outlineSlide = pptx.addSlide();
    outlineSlide.addText('Presentation Outline', {
      x: 0.5, y: 0.3, w: 12.33, h: 0.8,
      fontSize: 28, fontFace: 'Arial', color: colors.primary, bold: true,
    });
    let yPos = 1.5;
    slidesData.slice(0, 15).forEach((slide, index) => {
      if (slide.title && slide.title.toLowerCase() !== 'title slide' && slide.title.toLowerCase() !== 'thank you') {
        outlineSlide.addText(`${index + 1}. ${slide.title}`, {
          x: 1, y: yPos, w: 11, h: 0.5,
          fontSize: 16, fontFace: 'Arial', color: colors.text,
        });
        yPos += 0.6;
      }
    });

    // Content Slides
    slidesData.forEach((slideData, index) => {
      if (index === 0) return; // Skip title slide (already created)
      if (slideData.title?.toLowerCase().includes('thank you')) return;

      const slide = pptx.addSlide();
      
      // Slide number
      slide.addText(`Slide ${index}`, {
        x: 0.5, y: 0.2, w: 12.33, h: 0.4,
        fontSize: 12, fontFace: 'Arial', color: colors.lightText,
      });

      // Title
      slide.addText(slideData.title || `Section ${index}`, {
        x: 0.5, y: 0.7, w: 12.33, h: 0.8,
        fontSize: 24, fontFace: 'Arial', color: colors.primary, bold: true,
      });

      // Bullets
      let bulletY = 1.8;
      const bullets = slideData.bullets || ['No content available'];
      
      bullets.forEach((bullet: string) => {
        if (bulletY > 6.5) {
          // Create continuation slide
          const contSlide = pptx.addSlide();
          contSlide.addText(`${slideData.title} (Continued)`, {
            x: 0.5, y: 0.7, w: 12.33, h: 0.8,
            fontSize: 22, fontFace: 'Arial', color: colors.primary, bold: true,
          });
          bulletY = 1.8;
          // Add remaining bullets on new slide
          const remainingBullets = bullets.slice(bullets.indexOf(bullet));
          remainingBullets.forEach((remBullet: string) => {
            contSlide.addText([
              { text: '● ', options: { fontSize: 16, color: colors.primary } },
              { text: remBullet, options: { fontSize: 14, color: colors.text } },
            ], {
              x: 0.8, y: bulletY, w: 11.5, h: 0.6,
              fontSize: 14, fontFace: 'Arial', color: colors.text, valign: 'top',
            });
            bulletY += 0.7;
          });
          return;
        }

        slide.addText([
          { text: '● ', options: { fontSize: 16, color: colors.primary } },
          { text: bullet, options: { fontSize: 14, color: colors.text } },
        ], {
          x: 0.8, y: bulletY, w: 11.5, h: 0.6,
          fontSize: 14, fontFace: 'Arial', color: colors.text, valign: 'top',
        });
        bulletY += 0.7;
      });
    });

    // Final Thank You Slide
    const thankYouSlide = pptx.addSlide();
    thankYouSlide.background = { color: colors.primary };
    thankYouSlide.addText('Thank You', {
      x: 0.5, y: 2, w: 12.33, h: 1.5,
      fontSize: 48, fontFace: 'Arial', color: colors.white, align: 'center', bold: true,
    });
    thankYouSlide.addText('Questions & Discussion', {
      x: 0.5, y: 3.8, w: 12.33, h: 0.8,
      fontSize: 20, fontFace: 'Arial', color: colors.white, align: 'center', italic: true,
    });
    thankYouSlide.addText('Generated by VetSphere Academic Writer', {
      x: 0.5, y: 4.8, w: 12.33, h: 0.6,
      fontSize: 14, fontFace: 'Arial', color: colors.white, align: 'center',
    });

    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    return { buffer, apiUsed: 'PptxGenJS', error: '' };
  } catch (error: any) {
    console.error('PPTX generation error:', error);
    return { buffer: Buffer.from(''), apiUsed: 'none', error: error.message || 'PPTX generation failed' };
  }
}

// ============================================================
// MAIN POST HANDLER - ADD PPTX ACTION
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      level = 'degree',
      type = 'research',
      chapterIndex = 0,
      previousContext = '',
      action = 'generate',
      content = '',
    } = body;

    if (!topic && action !== 'pptx') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // ============================================================
    // ACTION: PPTX
    // ============================================================
    if (action === 'pptx') {
      if (!content) {
        return NextResponse.json({ error: 'Content is required for PPTX generation' }, { status: 400 });
      }

      // Step 1: AI generates the slide content
      const slideResult = await generatePptxContent(content, topic || 'Research Presentation', level || 'Master\'s Degree');
      if (slideResult.error || slideResult.slides.length === 0) {
        return NextResponse.json({ error: slideResult.error || 'Failed to generate slide content' }, { status: 502 });
      }

      // Step 2: Convert to PPTX file
      const pptxResult = await generatePptxFile(slideResult.slides, topic || 'Research Presentation', level || 'Master\'s Degree');
      if (pptxResult.error || !pptxResult.buffer) {
        return NextResponse.json({ error: pptxResult.error || 'Failed to create PPTX file' }, { status: 502 });
      }

      return new NextResponse(pptxResult.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(topic || 'presentation')}.pptx"`,
        },
      });
    }

    // ============================================================
    // ACTION: GENERATE (existing code continues here)
    // ============================================================
    // ... rest of existing generate code ...
    
  } catch (error: any) {
    console.error('Academic writer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate academic content' },
      { status: 500 }
    );
  }
}
