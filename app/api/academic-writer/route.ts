// app/api/academic-writer/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, level, type } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Academic level configurations
    const levelMap = {
      diploma: { 
        label: 'Diploma (2nd year college level)',
        wordCount: '1500-2000',
        detail: 'Foundational understanding with basic citations'
      },
      degree: { 
        label: "Bachelor's Degree (3rd/4th year)",
        wordCount: '2000-3000',
        detail: 'Comprehensive analysis with 10-15 citations'
      },
      masters: { 
        label: "Master's Degree (graduate level)",
        wordCount: '3000-4000',
        detail: 'Advanced research with 20-25 citations'
      },
      phd: { 
        label: 'PhD / Doctorate (advanced research)',
        wordCount: '4000-5000',
        detail: 'Original contribution with 30-40 citations'
      }
    };

    const typeLabels = {
      essay: 'Academic Essay',
      research: 'Research Paper',
      report: 'Research Report',
      'case-study': 'Case Study'
    };

    const levelInfo = levelMap[level as keyof typeof levelMap];
    const typeLabel = typeLabels[type as keyof typeof typeLabels];

    // Build the prompt
    const prompt = `
You are a professional academic writer specializing in veterinary science, animal health, and related fields. Write a comprehensive, well-structured ${typeLabel} on the topic:

"${topic}"

Academic Level: ${levelInfo.label}
Expected Length: ${levelInfo.wordCount} words
Detail Level: ${levelInfo.detail}

STRUCTURE REQUIREMENTS:

1. **Title Page**
   - Title: Clear, descriptive title for "${topic}"
   - Author: VetSphere Academic Writer
   - Date: Current date
   - Institution: Academic Institution

2. **Abstract** (150-250 words)
   - Purpose/background
   - Methodology
   - Key findings
   - Conclusions

3. **Table of Contents**
   - Main sections with page numbers

4. **Introduction** (10-15% of paper)
   - Background and context
   - Problem statement
   - Research questions (3-4)
   - Objectives
   - Significance of the study
   - Scope and limitations

5. **Literature Review** (25-30% of paper)
   - Historical overview
   - Theoretical frameworks
   - Recent research findings
   - Gaps in existing knowledge

6. **Methodology** (For research papers) OR **Main Body** (For essays)
   - Research approach
   - Data collection methods
   - Analysis techniques
   - Ethical considerations

7. **Findings/Results** (For research) OR **Discussion** (For essays)
   - Presentation of findings
   - Data analysis
   - Interpretation
   - Connection to research questions

8. **Discussion** (15-20% of paper)
   - Interpretation of findings
   - Implications
   - Comparison with existing literature
   - Limitations
   - Recommendations

9. **Conclusion** (5-10% of paper)
   - Summary of findings
   - Contribution to field
   - Recommendations for practice
   - Future research directions

10. **References**
    - ${level === 'phd' ? '30-40' : level === 'masters' ? '20-25' : '10-15'} peer-reviewed sources
    - APA 7th edition format

11. **Appendices** (if applicable)
    - Additional data
    - Survey instruments
    - Supplementary materials

WRITING GUIDELINES:
- Use formal, academic language appropriate for ${levelInfo.label}
- Avoid bias and maintain objectivity
- Use evidence-based arguments
- Include in-text citations throughout
- Ensure logical flow between sections
- Match the depth and complexity to ${levelInfo.label}

The content should be original, well-researched, and demonstrate critical thinking appropriate for the academic level.`;

    let aiResponse: string;

    // OPTION 1: Try Google Gemini (You have this API key)
    console.log('Attempting Gemini API...');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4000,
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API error');
      }
      
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                   'Failed to generate content. Please try again.';
      console.log('Gemini API success ✅');
    } catch (geminiError) {
      console.error('Gemini error:', geminiError);
      
      // OPTION 2: Fallback to OpenRouter
      console.log('Attempting OpenRouter API...');
      try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.BASE_URL || 'http://localhost:3000',
            'X-Title': 'VetSphere Academic Writer'
          },
          body: JSON.stringify({
            model: 'google/gemini-1.5-flash',
            messages: [
              { role: 'system', content: 'You are a professional academic writer. Generate well-structured, properly cited academic content.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
          })
        });

        const openRouterData = await openRouterResponse.json();
        
        if (openRouterData.error) {
          throw new Error(openRouterData.error.message || 'OpenRouter API error');
        }
        
        aiResponse = openRouterData.choices?.[0]?.message?.content || 
                     'Failed to generate content. Please try again.';
        console.log('OpenRouter API success ✅');
      } catch (openRouterError) {
        console.error('OpenRouter error:', openRouterError);
        
        // OPTION 3: Fallback to Groq
        console.log('Attempting Groq API...');
        try {
          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'mixtral-8x7b-32768',
              messages: [
                { role: 'system', content: 'You are a professional academic writer.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 4000,
            })
          });

          const groqData = await groqResponse.json();
          
          if (groqData.error) {
            throw new Error(groqData.error.message || 'Groq API error');
          }
          
          aiResponse = groqData.choices?.[0]?.message?.content || 
                       'Failed to generate content. Please try again.';
          console.log('Groq API success ✅');
        } catch (groqError) {
          console.error('Groq error:', groqError);
          throw new Error('All AI services failed. Please try again later.');
        }
      }
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
