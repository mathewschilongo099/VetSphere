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

    const cleanTopic = topic
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[‎]/g, '')
      .trim();

    const levelMap: Record<string, { label: string; detail: string; academicTip: string }> = {
      diploma: { 
        label: 'Diploma Level',
        detail: 'Write clear, practical content with step-by-step procedures. Include basic concepts, equipment lists, and safety considerations.',
        academicTip: 'Use clear topic sentences, avoid jargon, explain technical terms.'
      },
      degree: { 
        label: "Bachelor's Degree Level",
        detail: 'Write comprehensive, detailed procedures. Include step-by-step instructions for each species, equipment specifications, safety protocols, and practical considerations.',
        academicTip: 'Use evidence-based arguments, include citations, distinguish facts from interpretations.'
      },
      masters: { 
        label: "Master's Degree Level",
        detail: 'Write extensive, detailed procedures with critical analysis. Include comparative anatomy across species, advanced techniques, research-backed protocols, and diagnostic interpretation.',
        academicTip: 'Acknowledge counterarguments, use signal phrases for citations, demonstrate critical thinking.'
      },
      phd: { 
        label: 'PhD Level',
        detail: 'Write comprehensive, original content with exhaustive detail. Include historical development of techniques, comparative anatomy, advanced pathological interpretation, and research methodology.',
        academicTip: 'Contribute original insights, engage with theoretical frameworks, demonstrate methodological rigor.'
      }
    };

    const levelInfo = levelMap[level] || levelMap['degree'];

    // Determine document type structure
    let structureGuide = '';
    if (type === 'research') {
      structureGuide = `Structure: Title → Abstract → Introduction → Literature Review → Methodology → Results → Discussion → Conclusion → References → Appendices`;
    } else if (type === 'case-study') {
      structureGuide = `Structure: Title → Executive Summary → Introduction → Background → Case Description → Problem Identification → Analysis → Solutions → Outcome → Conclusion → References`;
    } else {
      structureGuide = `Structure: Title → Introduction → Main Body (with clear sections) → Conclusion → References`;
    }

    const prompt = `You are a veterinary pathologist writing a professional, practical assignment. Write clear, direct, and academically sound content.

TOPIC: ${cleanTopic}

ACADEMIC LEVEL: ${levelInfo.label}
DOCUMENT TYPE: ${typeLabels[type as keyof typeof typeLabels] || 'Assignment'}

ACADEMIC WRITING GUIDELINES:
1. Lead each paragraph with a topic sentence stating its main point
2. Use clear section headings (1.0 Introduction, 2.0 Methodology, etc.)
3. One idea per paragraph — avoid cramming multiple arguments together
4. Use topic-to-detail flow: general claim → evidence → analysis
5. Avoid contractions (use "do not" instead of "don't")
6. Avoid first-person casual phrasing ("I think" → "This analysis suggests")
7. Use precise, formal vocabulary
8. Every claim needs support: data, citation, or logical reasoning
9. Distinguish between fact, interpretation, and opinion explicitly
10. Use signal phrases when citing: "According to Smith (2023)..." or "The data indicate..."
11. Keep sentences direct — avoid unnecessary filler
12. ${levelInfo.academicTip}

FORMAT REQUIREMENTS:
- Use plain text with numbered headings (1.0, 2.0, 3.0, etc.)
- Use numbered lists (1., 2., 3., etc.) for steps
- DO NOT use markdown symbols (#, *, **, etc.)
- Write in clear, direct, practical language
- Focus on actionable, step-by-step procedures
- Be SPECIFIC — include actual anatomical details and organ names

STRUCTURE:
${structureGuide}

CONTENT REQUIREMENTS:
- Write SPECIFIC, DETAILED procedures for each species mentioned
- Include step-by-step instructions with anatomical details
- Write comprehensive, practical information useful to a veterinary student
- Include proper academic citations (Author, Year)
- Cover all species mentioned in the topic
- For each species: state positioning, then list numbered steps
- Include general precautions and conclusion

Generate a complete, well-structured academic assignment.`;

    let aiResponse = '';
    let apiUsed = '';

    // PRIMARY: Try Gemini API
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
                temperature: 0.5, 
                maxOutputTokens: 6000 
              }
            })
          }
        );
        const data = await response.json();
        if (!data.error) {
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          apiUsed = 'Gemini';
        }
      }
    } catch (e) {
      console.error('Gemini error:', e);
    }

    // FALLBACK: Try Groq
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
              temperature: 0.5,
              max_tokens: 6000,
            })
          });
          const data = await response.json();
          if (!data.error) {
            aiResponse = data.choices?.[0]?.message?.content || '';
            apiUsed = 'Groq';
          }
        }
      } catch (e) {
        console.error('Groq error:', e);
      }
    }

    // Clean response
    if (aiResponse) {
      aiResponse = aiResponse
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/`/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Ultimate fallback
    if (!aiResponse) {
      const date = new Date().toLocaleDateString();
      aiResponse = `PROCEDURE FOR CARRYING OUT POSTMORTEM EXAMINATION IN DIFFERENT ANIMAL SPECIES

Course: Animal Health and Production

Topic: ${cleanTopic}

1.0 Introduction

A postmortem examination (necropsy) is the systematic examination of an animal after death to determine the cause of death, identify diseases, evaluate organ changes, and collect samples for laboratory analysis. Before conducting a postmortem examination, the examiner should obtain the animal's history, wear appropriate personal protective equipment (PPE), prepare clean instruments, and select a suitable location away from healthy animals.

2.0 Bovine, Caprine and Ovine (Cattle, Goats and Sheep)

The animal is placed on its left lateral recumbency (left side) because the rumen remains on the lower side, allowing easier examination of the abdominal organs.

The procedure is as follows:

1. Record the history of the animal, including age, breed, sex, clinical signs, and date of death.
2. Wear protective clothing such as gloves, boots, overalls, and a face mask.
3. Perform an external examination by observing the body condition, skin, eyes, nose, mouth, anus, feet, and any visible injuries or swellings.
4. Make a skin incision from the lower jaw to the anus and reflect the skin away from the body.
5. Remove the left forelimb if necessary to improve access to the chest.
6. Open the abdominal cavity carefully without damaging the internal organs.
7. Open the thoracic cavity by cutting through the ribs and removing the rib cage.
8. Examine all organs systematically, including the heart, lungs, liver, spleen, kidneys, rumen, reticulum, omasum, abomasum, intestines, urinary bladder, reproductive organs, and lymph nodes.
9. Open and examine the head and brain if nervous disease is suspected.
10. Collect tissue, blood, or organ samples for laboratory examination where necessary.
11. Record all findings and dispose of the carcass safely by deep burial or incineration. Finally, clean and disinfect all equipment.

3.0 Equidae (Horse, Donkey and Mule)

The animal is positioned on its left side before examination.

The procedure includes:

1. Obtain the complete history of the animal.
2. Wear personal protective equipment.
3. Conduct a thorough external examination.
4. Make a skin incision from the jaw to the pelvis and reflect the skin.
5. Open the abdominal cavity carefully.
6. Open the thoracic cavity by cutting through the ribs.
7. Examine the heart, lungs, liver, spleen, kidneys, stomach, small intestine, cecum, large colon, small colon, urinary bladder, and reproductive organs.
8. Open the skull and examine the brain if neurological disease is suspected.
9. Collect samples for laboratory diagnosis.
10. Record all observations and dispose of the carcass properly.

4.0 Porcine (Pig)

The pig is usually placed on its back (dorsal recumbency) for easier access to both body cavities.

The procedure is as follows:

1. Obtain the animal's history.
2. Wear protective clothing.
3. Perform an external examination.
4. Make a midline incision from the throat to the pelvic region.
5. Reflect the skin and expose the muscles.
6. Open the abdominal cavity carefully.
7. Open the thoracic cavity by cutting through the ribs.
8. Examine the heart, lungs, liver, spleen, kidneys, stomach, intestines, pancreas, urinary bladder, reproductive organs, and lymph nodes.
9. Examine the joints if arthritis is suspected.
10. Collect tissue samples where necessary.
11. Record all findings, dispose of the carcass safely, and disinfect all equipment.

5.0 Canine and Feline (Dogs and Cats)

Dogs and cats are examined while lying on their back (dorsal recumbency).

The procedure includes:

1. Obtain the history of the animal.
2. Wear personal protective equipment.
3. Carry out a complete external examination.
4. Make a midline incision from the chin to the pelvis.
5. Reflect the skin and examine the muscles.
6. Open the abdominal cavity followed by the thoracic cavity.
7. Examine the heart, lungs, liver, spleen, kidneys, stomach, intestines, pancreas, urinary bladder, reproductive organs, and lymph nodes.
8. Open the skull and examine the brain if necessary.
9. Collect samples for laboratory examination.
10. Record all findings and dispose of the carcass safely while disinfecting all instruments.

6.0 Poultry Species

The bird is placed on its back (dorsal recumbency) during the postmortem examination.

The procedure is as follows:

1. Obtain the history of the flock or bird.
2. Wear gloves and other protective clothing.
3. Examine the bird externally for body condition, feather quality, comb, wattles, eyes, legs, and vent.
4. Wet the feathers with water to reduce contamination.
5. Remove the skin over the breast muscles.
6. Cut through both sides of the ribs and remove the sternum.
7. Examine the air sacs, lungs, heart, liver, spleen, crop, proventriculus, gizzard, intestines, ceca, kidneys, bursa of Fabricius, and reproductive organs.
8. Collect samples for laboratory diagnosis if required.
9. Record all findings.
10. Dispose of the carcass safely and disinfect all equipment used.

7.0 General Precautions During Postmortem Examination

- Always wear appropriate personal protective equipment.
- Use clean and sterilized instruments.
- Handle organs carefully to avoid contamination.
- Examine organs in a systematic order.
- Collect laboratory samples before contamination occurs.
- Record all abnormalities accurately.
- Wash and disinfect instruments after use.
- Dispose of carcasses by deep burial or incineration according to biosecurity regulations.

8.0 Conclusion

Postmortem examination is an important veterinary procedure used to determine the cause of death, diagnose diseases, and guide disease control measures. Although the positioning of the animal varies among species, the examination should always be systematic, thorough, and conducted under strict hygienic and biosecurity measures. Accurate recording of findings and proper disposal of the carcass are essential parts of every postmortem examination.`;
    }

    return NextResponse.json({ 
      content: aiResponse, 
      topic: cleanTopic,
      level,
      type,
      apiUsed,
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
