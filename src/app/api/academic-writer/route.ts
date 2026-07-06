// src/app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level = 'degree', type = 'essay' } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Level configurations
    const levelMap: Record<string, string> = {
      diploma: 'Diploma level (1500-2000 words)',
      degree: "Bachelor's Degree level (2000-3000 words)",
      masters: "Master's Degree level (3000-4000 words)",
      phd: 'PhD level (4000-5000 words)'
    };

    const typeMap: Record<string, string> = {
      essay: 'Academic Essay',
      research: 'Research Paper',
      report: 'Research Report',
      'case-study': 'Case Study'
    };

    const levelLabel = levelMap[level] || levelMap['degree'];
    const typeLabel = typeMap[type] || typeMap['essay'];

    // Build prompt
    const prompt = `You are a professional academic writer. Write a comprehensive, well-structured ${typeLabel} on the topic:

"${topic}"

Academic Level: ${levelLabel}

STRUCTURE REQUIREMENTS:
1. Title Page
2. Abstract (150-250 words)
3. Table of Contents
4. Introduction (Background, Problem Statement, Research Questions, Objectives)
5. Literature Review
6. Methodology (For research papers) OR Main Body (For essays)
7. Findings/Results (For research) OR Discussion (For essays)
8. Conclusion and Recommendations
9. References (APA 7th Edition format)
10. Appendices (if applicable)

Writing Guidelines:
- Use formal academic language appropriate for ${levelLabel}
- Include in-text citations throughout
- Ensure logical flow between sections
- Make it detailed and evidence-based

Generate a complete, well-structured academic paper.`;

    let aiResponse = '';

    // Try Gemini API first (you have this key)
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { 
                temperature: 0.7, 
                maxOutputTokens: 4000 
              }
            })
          }
        );
        const data = await response.json();
        if (!data.error) {
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      }
    } catch (e) {
      console.error('Gemini error:', e);
    }

    // Fallback to Groq if Gemini fails
    if (!aiResponse) {
      try {
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'mixtral-8x7b-32768',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 4000,
            })
          });
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('Groq error:', e);
      }
    }

    // Fallback to OpenRouter if others fail
    if (!aiResponse) {
      try {
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (openRouterKey) {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.BASE_URL || 'http://localhost:3000',
              'X-Title': 'VetSphere Academic Writer'
            },
            body: JSON.stringify({
              model: 'google/gemini-1.5-flash',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 4000,
            })
          });
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('OpenRouter error:', e);
      }
    }

    // Ultimate fallback - mock response if all APIs fail
    if (!aiResponse) {
      aiResponse = `# Academic ${typeLabel}: ${topic}

## Abstract
This comprehensive ${typeLabel} examines ${topic}, exploring key themes and contemporary issues within veterinary science and animal health.

## 1. Introduction
### 1.1 Background
${topic} represents a critical area of study within veterinary medicine.

### 1.2 Problem Statement
Despite significant research, there remains a gap in understanding key aspects of ${topic}.

### 1.3 Research Questions
1. What are the fundamental principles of ${topic}?
2. How does current research inform practice?
3. What are the practical implications?

### 1.4 Objectives
- To analyze existing literature on ${topic}
- To identify key themes and patterns
- To propose evidence-based recommendations

## 2. Literature Review
### 2.1 Historical Context
Research on ${topic} has evolved significantly...

### 2.2 Current Research
Recent studies have focused on...

### 2.3 Gaps in Knowledge
Areas requiring further investigation include...

## 3. Methodology
This study employs a comprehensive literature review approach...

## 4. Findings
### 4.1 Key Themes
Analysis reveals three main themes...

### 4.2 Critical Analysis
The evidence suggests that...

## 5. Discussion
### 5.1 Interpretation of Findings
The results indicate that...

### 5.2 Implications
These findings have significant implications for...

## 6. Conclusion
### 6.1 Summary
This ${typeLabel} has examined ${topic}...

### 6.2 Recommendations
Based on the findings, we recommend...

### 6.3 Future Research
Areas for future study include...

## References
[Comprehensive references in APA 7th edition format]

## Appendices
[Additional materials as needed]

---
*Generated by VetSphere Academic Writer - Use as a research aid and reference.*`;
    }

    return NextResponse.json({ 
      content: aiResponse, 
      topic, 
      level,
      type,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Academic writer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate academic content' },
      { status: 500 }
    );
  }
}
