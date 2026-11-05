// src/app/api/python-pptx/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

const MAX_CONTENT_CHARS = 100000;

export async function POST(request: NextRequest) {
  // Every request gets its own temp folder so two people generating a deck at
  // the same time can never overwrite or receive each other's file.
  let workDir = '';
  try {
    const body = await request.json();
    const { content, topic, level } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json({ error: 'Content is too long' }, { status: 413 });
    }

    // Extract sections from the research paper
    const sections = extractSections(content);

    // Build the Python script
    const pythonScript = `
import sys
import json
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

def create_presentation(data):
    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    
    topic = data.get('topic', 'Research Presentation')
    level = data.get('level', "Master's Degree")
    slides_data = data.get('slides', [])
    
    PRIMARY = RGBColor(11, 92, 255)
    DARK = RGBColor(26, 26, 46)
    WHITE = RGBColor(255, 255, 255)
    
    # TITLE SLIDE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = PRIMARY
    
    box = slide.shapes.add_textbox(Inches(0.5), Inches(1.5), Inches(12.33), Inches(2))
    p = box.text_frame.paragraphs[0]
    p.text = topic.upper()
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    box = slide.shapes.add_textbox(Inches(0.5), Inches(3.8), Inches(12.33), Inches(0.8))
    p = box.text_frame.paragraphs[0]
    p.text = 'Research Presentation'
    p.font.size = Pt(24)
    p.font.italic = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    box = slide.shapes.add_textbox(Inches(0.5), Inches(5.5), Inches(12.33), Inches(0.6))
    p = box.text_frame.paragraphs[0]
    p.text = f'VetSphere Academic Writer • {level} • {data.get("date", "")}'
    p.font.size = Pt(16)
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    # OUTLINE SLIDE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12.33), Inches(0.8))
    p = box.text_frame.paragraphs[0]
    p.text = 'Presentation Outline'
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    
    y = 1.5
    for i, s in enumerate(slides_data[:12], 1):
        box = slide.shapes.add_textbox(Inches(1), Inches(y), Inches(11), Inches(0.5))
        p = box.text_frame.paragraphs[0]
        p.text = f'{i}. {s.get("title", "Slide")}'
        p.font.size = Pt(16)
        p.font.color.rgb = DARK
        y += 0.6
    
    # CONTENT SLIDES
    for idx, slide_data in enumerate(slides_data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        
        box = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(12.33), Inches(0.4))
        p = box.text_frame.paragraphs[0]
        p.text = f'Slide {idx + 3}'
        p.font.size = Pt(12)
        p.font.color.rgb = RGBColor(102, 102, 102)
        
        box = slide.shapes.add_textbox(Inches(0.5), Inches(0.7), Inches(12.33), Inches(0.8))
        p = box.text_frame.paragraphs[0]
        p.text = slide_data.get('title', 'Section')
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = PRIMARY
        
        bullets = slide_data.get('bullets', ['Key information not available'])
        y = 1.8
        for bullet in bullets[:6]:
            if y > 6.5:
                break
            box = slide.shapes.add_textbox(Inches(0.8), Inches(y), Inches(11.5), Inches(0.6))
            p = box.text_frame.paragraphs[0]
            p.text = f'● {bullet}'
            p.font.size = Pt(14)
            p.font.color.rgb = DARK
            y += 0.7
    
    # THANK YOU SLIDE
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = PRIMARY
    
    box = slide.shapes.add_textbox(Inches(0.5), Inches(2), Inches(12.33), Inches(1.5))
    p = box.text_frame.paragraphs[0]
    p.text = 'Thank You'
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    box = slide.shapes.add_textbox(Inches(0.5), Inches(3.8), Inches(12.33), Inches(0.8))
    p = box.text_frame.paragraphs[0]
    p.text = 'Questions & Discussion'
    p.font.size = Pt(20)
    p.font.italic = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    box = slide.shapes.add_textbox(Inches(0.5), Inches(4.8), Inches(12.33), Inches(0.6))
    p = box.text_frame.paragraphs[0]
    p.text = 'Generated by VetSphere Academic Writer'
    p.font.size = Pt(14)
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    prs.save(data['out'])
    print('SUCCESS')

if __name__ == "__main__":
    data = json.loads(sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read())
    create_presentation(data)
`;

    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pptx-'));
    const scriptPath = path.join(workDir, 'generate_pptx.py');
    const pptxPath = path.join(workDir, 'presentation.pptx');
    fs.writeFileSync(scriptPath, pythonScript);

    // Prepare data
    const data = {
      topic: typeof topic === 'string' && topic ? topic : 'Research Presentation',
      level: typeof level === 'string' && level ? level : "Master's Degree",
      date: new Date().toLocaleDateString(),
      out: pptxPath,
      slides: sections.map(s => ({
        title: s.title,
        bullets: s.bullets.slice(0, 6)
      }))
    };

    // Run Python
    // execFile passes arguments directly (no shell), so user text can never
    // be interpreted as a command.
    const { stderr } = await execFileAsync(
      'python3',
      [scriptPath, JSON.stringify(data)],
      { timeout: 30000, maxBuffer: 1024 * 1024 }
    );

    if (stderr && !stderr.includes('SUCCESS')) {
      console.error('Python error:', stderr);
      return NextResponse.json({ error: 'Python generation failed' }, { status: 500 });
    }

    // Read the generated file
    const buffer = fs.readFileSync(pptxPath);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(data.topic)}.pptx"`,
      },
    });

  } catch (error: any) {
    console.error('PPTX generation error:', error);
    // Do not return error.message: it can contain server paths and command output.
    return NextResponse.json({ error: 'Failed to generate PPTX' }, { status: 500 });
  } finally {
    if (workDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
}

function extractSections(content: string): { title: string; bullets: string[] }[] {
  const sections: { title: string; bullets: string[] }[] = [];
  const lines = content.split('\n');
  let currentSection: { title: string; bullets: string[] } | null = null;

  const keywords = [
    'ABSTRACT', 'INTRODUCTION', 'BACKGROUND', 'PROBLEM', 'OBJECTIVES',
    'QUESTIONS', 'LITERATURE REVIEW', 'THEORETICAL', 'METHODOLOGY',
    'FINDINGS', 'DISCUSSION', 'CONCLUSIONS', 'RECOMMENDATIONS'
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isSection = keywords.some(k =>
      trimmed.toUpperCase().includes(k) && trimmed.length < 100
    );

    if (isSection && !trimmed.startsWith('●') && !trimmed.startsWith('-')) {
      if (currentSection && currentSection.bullets.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed.slice(0, 60), bullets: [] };
      continue;
    }

    if (currentSection && trimmed.length > 20 && trimmed.length < 200) {
      let bullet = trimmed
        .replace(/^[0-9. ]+/, '')
        .replace(/^[-•*]\s*/, '')
        .trim();
      if (bullet.length > 10 && bullet.length < 150) {
        currentSection.bullets.push(bullet.slice(0, 120));
      }
    }
  }

  if (currentSection && currentSection.bullets.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}
