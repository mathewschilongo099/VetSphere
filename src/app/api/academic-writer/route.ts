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

    const typeLabels: Record<string, string> = {
      essay: 'Assignment',
      research: 'Research Paper',
      report: 'Report',
      'case-study': 'Case Study'
    };

    const levelMap: Record<string, { label: string; pageCount: string }> = {
      diploma: { 
        label: 'Diploma Level',
        pageCount: '20-30 pages'
      },
      degree: { 
        label: "Bachelor's Degree Level",
        pageCount: '30-45 pages'
      },
      masters: { 
        label: "Master's Degree Level",
        pageCount: '40-60 pages'
      },
      phd: { 
        label: 'PhD Level',
        pageCount: '50-80 pages'
      }
    };

    const levelInfo = levelMap[level] || levelMap['degree'];
    const typeLabel = typeLabels[type] || 'Assignment';

    let aiResponse = '';
    let apiUsed = '';

    // ============================================================
    // RESEARCH PAPER - Full academic structure
    // ============================================================
    if (type === 'research') {
      console.log('🔬 Generating full research paper...');

      const researchPrompt = `You are a veterinary researcher writing a COMPLETE research paper for ${levelInfo.label}. This should be a FULL dissertation/research paper of ${levelInfo.pageCount}.

RESEARCH TOPIC: "${cleanTopic}"

Write a COMPLETE research paper with ALL these sections. Each section must have 5-8 detailed paragraphs with specific information, examples, evidence, and citations:

1.0 Title Page (with author, student number, supervisor, degree, date)
2.0 Declaration
3.0 Dedication
4.0 Acknowledgements
5.0 Table of Contents (with proper indentation and page numbers)
6.0 Abstract (250-350 words)
7.0 List of Abbreviations and Acronyms
8.0 CHAPTER ONE: INTRODUCTION
   8.1 Introduction
   8.2 Background of the Study
   8.3 Statement of the Problem
   8.4 Research Objectives (General and Specific)
   8.5 Research Questions
   8.6 Significance of the Study
   8.7 Scope of Study
   8.8 Operational Definitions
9.0 CHAPTER TWO: LITERATURE REVIEW
   9.1 Introduction
   9.2 Empirical Review (subsections as needed)
   9.3 Theoretical Framework
   9.4 Conceptual Framework
10.0 CHAPTER THREE: RESEARCH METHODOLOGY
    10.1 Introduction
    10.2 Research Approach
    10.3 Research Design
    10.4 Study Location
    10.5 Target Population
    10.6 Sample Size
    10.7 Data Collection Instruments and Procedures
    10.8 Data Analysis Plan
    10.9 Reliability and Validity
    10.10 Ethical Considerations
11.0 CHAPTER FOUR: PRESENTATION OF FINDINGS
    11.1 Introduction
    11.2 Descriptive Results
    11.3 Univariate Analysis
    11.4 Multivariable Analysis
    11.5 Summary of Findings
12.0 CHAPTER FIVE: DISCUSSION
    12.1 Introduction
    12.2 Interpretation of Findings
    12.3 Comparison with Previous Studies
    12.4 Implications for Practice
    12.5 Limitations of the Study
13.0 CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS
    13.1 Conclusions
    13.2 Recommendations
14.0 REFERENCES (APA 7th Edition - 30-50 sources)
15.0 APPENDICES

IMPORTANT FORMATTING:
- Use proper academic language throughout
- Include in-text citations (Author, Year)
- Each section must have 5-8 detailed paragraphs
- Table of Contents must show indented subheadings with page numbers
- Include all front matter (Declaration, Dedication, Acknowledgements)

Generate the complete research paper now with all sections.`;

      // Try Gemini first (most reliable)
      try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
          const startTime = Date.now();
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: researchPrompt }] }],
                generationConfig: { 
                  temperature: 0.4, 
                  maxOutputTokens: 16000 
                }
              })
            }
          );
          const data = await response.json();
          if (!data.error) {
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            apiUsed = 'Gemini (Research)';
            console.log(`Gemini API success ✅ (${Date.now() - startTime}ms) - Length: ${aiResponse.length} characters`);
          }
        }
      } catch (e) {
        console.error('Gemini error:', e);
      }

      // Fallback to OpenRouter
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
                model: 'google/gemini-1.5-pro',
                messages: [{ role: 'user', content: researchPrompt }],
                temperature: 0.4,
                max_tokens: 16000,
              })
            });
            const data = await response.json();
            if (!data.error && data.choices) {
              aiResponse = data.choices[0]?.message?.content || '';
              apiUsed = 'OpenRouter (Research)';
              console.log(`OpenRouter API success ✅ - Length: ${aiResponse.length} characters`);
            }
          }
        } catch (e) {
          console.error('OpenRouter error:', e);
        }
      }

      // Ultimate fallback - generate comprehensive research paper
      if (!aiResponse) {
        console.log('⚠️ All APIs failed, using comprehensive fallback...');
        aiResponse = generateFullResearchPaper(cleanTopic, levelInfo);
        apiUsed = 'Fallback (Comprehensive)';
      }
    }

    // ============================================================
    // ASSIGNMENT / REPORT / CASE STUDY
    // ============================================================
    else {
      console.log(`📝 ${typeLabel}: Generating practical content...`);

      const assignmentPrompt = `You are a veterinary professional writing a detailed, practical ${typeLabel} for ${levelInfo.label}.

TOPIC: "${cleanTopic}"

Write a DETAILED, practical ${typeLabel} with:

1.0 Title Page
2.0 Introduction (Background, Purpose, Objectives)
3.0 Main Body (Detailed practical content with clear sections)
   - For each species: state positioning, then list numbered steps
   - Include specific anatomical details
   - Include equipment and safety considerations
4.0 Conclusion (Summary, Final Remarks, Recommendations)
5.0 References (APA 7th Edition - 10-20 sources)
6.0 Appendices (if applicable)

Write 3-5 detailed paragraphs per section with specific examples.`;

      // Try Gemini
      try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: assignmentPrompt }] }],
                generationConfig: { 
                  temperature: 0.5, 
                  maxOutputTokens: 8000 
                }
              })
            }
          );
          const data = await response.json();
          if (!data.error) {
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            apiUsed = 'Gemini (Assignment)';
          }
        }
      } catch (e) {
        console.error('Gemini error:', e);
      }

      // Fallback to Groq
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
                messages: [{ role: 'user', content: assignmentPrompt }],
                temperature: 0.5,
                max_tokens: 8000,
              })
            });
            const data = await response.json();
            if (!data.error) {
              aiResponse = data.choices?.[0]?.message?.content || '';
              apiUsed = 'Groq (Assignment)';
            }
          }
        } catch (e) {
          console.error('Groq error:', e);
        }
      }

      // Ultimate fallback for assignment
      if (!aiResponse) {
        aiResponse = generateDetailedAssignment(cleanTopic);
        apiUsed = 'Fallback (Assignment)';
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

    return NextResponse.json({ 
      content: aiResponse, 
      topic: cleanTopic,
      level,
      type,
      apiUsed,
      wordCount: aiResponse.split(/\s+/).length,
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

// ============================================================
// FULL RESEARCH PAPER GENERATOR (Complete structure)
// ============================================================
function generateFullResearchPaper(topic: string, levelInfo: any): string {
  const date = new Date().toLocaleDateString();
  
  return `1.0 Title Page

${topic}: A Comprehensive Research Analysis

Author: VetSphere Academic Writer
Student Number: VS2026001
Degree: ${levelInfo.label}
Supervisor: Professor [Name]

A dissertation submitted to the University of Veterinary Sciences in partial fulfilment of the requirements for the award of a ${levelInfo.label}

Date of Submission: ${date}

2.0 Declaration

I, VetSphere Academic Writer, declare that this research paper represents my own original work and has not been submitted previously, in part or in whole, for the award of any degree at this or any other university. All sources of information used have been duly acknowledged through complete referencing.

Signature: _________________________
Date: _________________________

3.0 Dedication

This work is dedicated to all veterinary professionals and students who continue to advance animal health through dedicated research and practice, and to the animals whose welfare remains at the centre of our profession.

4.0 Acknowledgements

I wish to express my deepest appreciation and gratitude to all those who have given me the possibility to complete this research. I am particularly grateful to the veterinary professionals, researchers, and academics whose work has informed this study. I further extend my deepest appreciation to my supervisor, whose guidance and mentorship have been invaluable throughout this research. To my colleagues and friends, thanks for your moral encouragement.

5.0 Table of Contents

1.0 Title Page ......................................................... i
2.0 Declaration ........................................................ ii
3.0 Dedication ......................................................... iii
4.0 Acknowledgements ................................................... iv
5.0 Table of Contents .................................................. v
6.0 Abstract ........................................................... vi
7.0 List of Abbreviations and Acronyms ................................. vii
8.0 CHAPTER ONE: INTRODUCTION .......................................... 1
   8.1 Introduction .................................................... 1
   8.2 Background of the Study ......................................... 1
   8.3 Statement of the Problem ........................................ 3
   8.4 Research Objectives ............................................. 4
   8.4.1 General Objective ............................................. 4
   8.4.2 Specific Objectives .......................................... 4
   8.5 Research Questions .............................................. 4
   8.6 Significance of the Study ....................................... 5
   8.7 Scope of Study .................................................. 5
   8.8 Operational Definitions ......................................... 5
9.0 CHAPTER TWO: LITERATURE REVIEW .................................... 6
   9.1 Introduction .................................................... 6
   9.2 Empirical Review ................................................ 6
   9.2.1 Prevalence of the Condition ................................... 6
   9.2.2 Demographic and Socio behavioural Predictors .................. 7
   9.2.3 Clinical Predictors ........................................... 8
   9.3 Theoretical Framework ........................................... 10
   9.4 Conceptual Framework ............................................ 10
10.0 CHAPTER THREE: RESEARCH METHODOLOGY .............................. 12
    10.1 Introduction .................................................. 12
    10.2 Research Approach ............................................. 12
    10.3 Research Design ............................................... 12
    10.4 Study Location ................................................ 12
    10.5 Target Population ............................................. 12
    10.6 Sample Size ................................................... 13
    10.7 Data Collection Instruments and Procedures .................... 13
    10.8 Data Analysis Plan ............................................ 13
    10.9 Reliability and Validity ...................................... 14
    10.10 Ethical Considerations ....................................... 14
11.0 CHAPTER FOUR: PRESENTATION OF FINDINGS ........................... 15
    11.1 Introduction .................................................. 15
    11.2 Descriptive Results ........................................... 15
    11.3 Univariate Analysis ........................................... 16
    11.4 Multivariable Analysis ........................................ 19
    11.5 Summary of Findings ........................................... 21
12.0 CHAPTER FIVE: DISCUSSION ......................................... 25
    12.1 Introduction .................................................. 25
    12.2 Interpretation of Findings .................................... 25
    12.3 Comparison with Previous Studies .............................. 26
    12.4 Implications for Practice ..................................... 28
    12.5 Limitations of the Study ...................................... 29
13.0 CHAPTER SIX: CONCLUSIONS AND RECOMMENDATIONS ..................... 31
    13.1 Conclusions ................................................... 31
    13.2 Recommendations ............................................... 32
    13.2.1 Recommendations to Management ............................... 32
    13.2.2 Recommendations to Clinical Staff ........................... 33
    13.2.3 Recommendations for Future Research ......................... 34
14.0 REFERENCES ........................................................ 35
15.0 APPENDICES ........................................................ 38
    Appendix A: Data Collection Instrument ............................. 38
    Appendix B: Informed Consent Form ................................. 39

6.0 Abstract

This comprehensive research paper provides an in-depth analysis of ${topic}, examining the procedures, protocols, species-specific considerations, and evidence-based best practices essential for effective implementation in veterinary medicine. The study employs a systematic literature review methodology, synthesizing findings from peer-reviewed sources published between 2015 and 2025. The research encompasses multiple species including bovine, caprine, ovine, equine, porcine, canine, feline, and poultry, with detailed attention to species-specific anatomical and physiological variations. Key findings reveal significant species-specific differences in procedural approaches, positioning requirements, and diagnostic protocols. The research identifies that while general principles apply across species, each species requires specific adaptations based on unique anatomical and physiological characteristics. The study concludes with evidence-based recommendations for standardizing protocols, enhancing diagnostic accuracy, and improving veterinary practice outcomes. This research contributes to the advancement of veterinary pathology and supports evidence-based practice in animal health management.

Keywords: postmortem examination, necropsy, veterinary pathology, species-specific protocols, diagnostic procedures, animal health

7.0 List of Abbreviations and Acronyms

ACVP  American College of Veterinary Pathologists
ART   Antiretroviral Therapy
CT    Computed Tomography
ECVP  European College of Veterinary Pathologists
HIV   Human Immunodeficiency Virus
LTBI  Latent Tuberculosis Infection
MRI   Magnetic Resonance Imaging
MTB   Mycobacterium tuberculosis
PPE   Personal Protective Equipment
TB    Tuberculosis
WHO   World Health Organization
WOAH  World Organisation for Animal Health

8.0 CHAPTER ONE: INTRODUCTION

8.1 Introduction

This chapter provides the background of the study, statement of the problem, research objectives, research questions, significance of the study, scope of the study, and operational definitions of key terms. The chapter begins with a background of the importance of ${topic} in veterinary medicine, outlines the rationale and direction of the research, and establishes the foundation for the subsequent chapters.

8.2 Background of the Study

${topic} represents one of the most fundamental and essential diagnostic procedures in veterinary medicine. The systematic examination of animals after death serves multiple critical purposes that extend far beyond determining the cause of death. This procedure provides invaluable information for disease surveillance, outbreak investigation, epidemiological studies, and the advancement of veterinary knowledge. Understanding the cause of death, identifying subclinical diseases, evaluating pathological changes in organs and tissues, and collecting high-quality samples for laboratory analysis are all essential outcomes of a properly conducted ${topic}.

The importance of ${topic} cannot be overstated in the context of veterinary medicine. In many cases, it provides the only opportunity to definitively diagnose diseases that may have been challenging to identify during the animal's life. Additionally, postmortem findings often reveal conditions that were not suspected based on clinical signs alone, contributing to a more comprehensive understanding of disease processes and their manifestations across different species (Smith, 2020). For livestock producers, postmortem findings can guide management decisions, biosecurity protocols, and treatment strategies for remaining animals in the herd or flock.

Furthermore, ${topic} plays a crucial role in veterinary public health and food safety. The identification of zoonotic diseases, foodborne pathogens, and emerging infectious diseases often relies heavily on necropsy findings and subsequent laboratory testing. During disease outbreaks, rapid and accurate postmortem examinations are essential for implementing appropriate control measures and preventing further spread of disease (Anderson, 2023).

The historical development of ${topic} techniques reflects the broader evolution of veterinary medicine and pathology. Early approaches were largely descriptive, focusing on gross examination of organs and identification of obvious lesions that could be seen with the naked eye. The development of histopathology in the 19th century provided a more detailed understanding of disease processes at the cellular level, revolutionizing veterinary pathology and diagnostic medicine (Smith, 2020).

The 20th century saw the establishment of standardized protocols for ${topic}, driven by the need for consistent disease surveillance, the growing recognition of zoonotic diseases, and the development of veterinary public health programs. Organizations such as the World Organisation for Animal Health (WOAH) and the American College of Veterinary Pathologists (ACVP) have contributed to the standardization of protocols and the promotion of evidence-based practice.

Recent advances in diagnostic imaging, molecular biology, and laboratory techniques have further enhanced the capabilities and applications of ${topic}. Advanced imaging modalities such as computed tomography (CT) and magnetic resonance imaging (MRI) are increasingly used to supplement traditional necropsy approaches, providing detailed anatomical information and facilitating the identification of subtle lesions (Thompson et al., 2021).

8.3 Statement of the Problem

Despite the established importance of ${topic} in veterinary medicine, there remains significant variation in procedural approaches, quality standards, and documentation practices across different veterinary practices, institutions, and regions. This variation can lead to inconsistent diagnostic outcomes, missed diagnoses, incomplete disease surveillance data, and reduced effectiveness of epidemiological investigations.

Several factors contribute to this problem. First, the lack of standardized protocols across all veterinary species means that practitioners may use different approaches depending on their training, experience, and institutional guidelines. Second, the increasing recognition of emerging diseases and the need for rapid diagnostic response has highlighted the importance of standardized, evidence-based protocols that can be consistently applied across different settings (Johnson & Williams, 2022). Third, the growing demand for veterinary services and the pressure to conduct ${topic} efficiently may compromise the quality and thoroughness of the procedures.

8.4 Research Objectives

8.4.1 General Objective

To comprehensively examine and document standardized procedures for ${topic} across major veterinary species and provide evidence-based recommendations for practice.

8.4.2 Specific Objectives

1. To examine and document standardized ${topic} procedures for major veterinary species including bovine, caprine, ovine, equine, porcine, canine, feline, and poultry.

2. To identify and describe the species-specific anatomical considerations that influence procedural approaches and positioning requirements.

3. To evaluate the current evidence base supporting various ${topic} protocols and identify areas requiring further research.

4. To provide evidence-based recommendations for optimizing ${topic} practices, including equipment requirements, safety protocols, and documentation procedures.

8.5 Research Questions

1. What are the current standardized protocols for ${topic} across different veterinary species, and how do these protocols vary between species?

2. What species-specific anatomical and physiological considerations must be addressed when conducting ${topic}?

3. What are the essential equipment, safety protocols, and documentation requirements for effective ${topic}?

4. How can ${topic} protocols be optimized to improve diagnostic accuracy, efficiency, and consistency across different veterinary settings?

5. What is the role of ${topic} in veterinary disease surveillance, outbreak investigation, and public health protection?

8.6 Significance of the Study

This research is significant for several important reasons. First, it provides a comprehensive and accessible reference for veterinary professionals, students, and researchers on standardized ${topic} procedures across multiple species. This reference can serve as a valuable educational resource and practical guide for practitioners in various settings.

Second, the research highlights the importance of species-specific approaches, emphasizing that effective ${topic} requires detailed knowledge of comparative anatomy, pathology, and disease processes across different species. Third, the study contributes to the growing body of evidence supporting evidence-based veterinary practice and quality improvement in veterinary pathology and diagnostics.

Fourth, the findings support the broader goals of disease surveillance, epidemiological investigation, and veterinary public health by promoting standardized, consistent approaches to ${topic}. Finally, the research identifies important knowledge gaps and areas requiring further investigation, providing direction for future research in this critical area of veterinary medicine.

8.7 Scope of Study

This research focuses on the major veterinary species commonly encountered in veterinary practice and livestock production: bovine, caprine, ovine, equine, porcine, canine, feline, and poultry. The scope includes both livestock and companion animals, providing comprehensive coverage of the most frequently examined species.

While the research is based on an extensive literature review and synthesis of current evidence, there are several limitations to consider. First, the review may not include all emerging techniques, advanced imaging modalities, or species-specific variations that have been described in the literature. Second, the research primarily focuses on traditional techniques and may not fully address the potential applications of new technologies and diagnostic approaches. Third, the geographic scope of the literature reviewed may not fully represent the diversity of practice across different regions and countries.

8.8 Operational Definitions

Postmortem Examination (Necropsy): The systematic examination of an animal after death to determine cause of death, identify diseases, evaluate pathological changes, and collect samples for laboratory analysis.

Species-Specific Protocol: A standardized set of procedures adapted for a particular species based on its unique anatomical and physiological characteristics.

Evidence-Based Practice: Clinical decision-making that integrates the best available research evidence with clinical expertise and patient values.

Biosecurity: Measures taken to prevent the introduction and spread of infectious diseases in animal populations.

Zoonotic Disease: A disease that can be transmitted between animals and humans.

9.0 CHAPTER TWO: LITERATURE REVIEW

9.1 Introduction

This chapter reviews existing empirical literature on ${topic}, organised around the specific objectives of the study, before presenting the theoretical and conceptual frameworks that guide the analysis. The review draws on studies published within the last ten years from various regions, with the aim of identifying patterns, inconsistencies, and the specific gap that this study addresses.

9.2 Empirical Review

9.2.1 Prevalence and Importance of the Topic

A substantial body of research has examined the importance and prevalence of ${topic} across different health systems and veterinary settings. Studies have consistently demonstrated that ${topic} is essential for accurate diagnosis, disease surveillance, and the advancement of veterinary knowledge.

Research has shown that ${topic} provides invaluable information for determining cause of death, identifying subclinical diseases, and evaluating pathological changes (Smith, 2020). The procedure is particularly important in cases where clinical diagnosis was inconclusive or where disease surveillance requires pathological confirmation.

The prevalence of ${topic} in veterinary practice varies depending on the setting, with referral hospitals and academic institutions conducting more examinations than primary care practices. However, the importance of ${topic} is universally recognized across all levels of veterinary practice (Anderson, 2023).

9.2.2 Species-Specific Considerations

Research has highlighted the importance of species-specific considerations in ${topic}. Different species have unique anatomical features, disease susceptibilities, and procedural requirements that must be addressed for effective examination (Williams & Brown, 2022). Understanding these species-specific factors is essential for accurate diagnosis and effective disease surveillance.

Studies have examined the specific positioning requirements, incision techniques, and organ examination protocols for different species. The variation in positioning requirements across species reflects the unique anatomical characteristics and body plans of each species (Johnson & Williams, 2022).

9.2.3 Clinical and Diagnostic Predictors

Recent research has focused on identifying clinical and diagnostic predictors of outcomes related to ${topic}. Studies have examined the use of advanced imaging techniques, standardized sampling protocols, and quality assurance programs to enhance the quality and value of findings (Thompson et al., 2021).

The role of ${topic} in disease surveillance and outbreak investigation has been a particular focus of recent research. Studies have highlighted the importance of rapid, standardized protocols for identifying emerging diseases, investigating disease outbreaks, and implementing control measures (Anderson, 2023).

9.3 Theoretical Framework

This research is guided by established theoretical frameworks in veterinary pathology and diagnostic medicine. The systematic approach to ${topic} is grounded in the understanding of normal anatomy, pathophysiology, and disease processes across different species. This theoretical framework provides the basis for examining organs, identifying lesions, interpreting pathological findings, and establishing the cause of death.

The principles of gross pathology, histopathology, and clinical pathology inform the approach to ${topic}. Gross pathology involves the macroscopic examination of organs and tissues, looking for abnormalities in size, color, consistency, and structure. Histopathology involves the microscopic examination of tissues to identify cellular changes, inflammatory patterns, and pathological processes that may not be visible on gross examination (Smith, 2020).

9.4 Conceptual Framework

This research is guided by a conceptual framework that integrates comparative anatomy, pathology, and evidence-based practice. The framework emphasizes the importance of systematic examination, species-specific approaches, and the integration of clinical and pathological findings.

The conceptual framework recognizes that effective ${topic} requires:
1. Detailed knowledge of normal and abnormal anatomy across species
2. Understanding of disease processes and their pathological manifestations
3. Systematic approaches to examination and documentation
4. Species-specific adaptations based on anatomical and physiological differences
5. Integration of clinical history and laboratory findings
6. Evidence-based practice and continuous quality improvement

10.0 CHAPTER THREE: RESEARCH METHODOLOGY

10.1 Introduction

This chapter describes the research approach and design, the study location, the target population, the sample size calculation, the data collection instruments and procedures, the data analysis plan, the measures taken to ensure reliability and validity, and the ethical considerations that governed the conduct of the study.

10.2 Research Approach

This study employs a comprehensive literature review approach, synthesizing findings from peer-reviewed sources to examine ${topic} procedures across veterinary species. The methodology is appropriate for examining the current state of knowledge on this topic and identifying best practices, species-specific considerations, and areas requiring further research.

10.3 Research Design

The research uses a systematic literature review design, following established guidelines for conducting comprehensive reviews of veterinary and medical literature. This approach allows for the systematic identification, evaluation, and synthesis of relevant studies and publications.

10.4 Study Location

The research covers veterinary species globally, with a focus on the major species of veterinary importance. The geographic scope includes research from North America, Europe, Australia, and other regions with significant veterinary research contributions.

10.5 Target Population

The target population includes all veterinary species for which ${topic} is commonly performed. This includes domestic livestock (bovine, caprine, ovine, equine, porcine), companion animals (canine, feline), and poultry.

10.6 Sample Size

This is a literature review, so sample size refers to the number of studies and publications included in the review. A comprehensive search strategy was employed to identify all relevant studies, ensuring adequate coverage of the topic.

10.7 Data Collection Instruments and Procedures

Data was collected from several sources to ensure comprehensive coverage of the topic:

1. Peer-reviewed journals in veterinary pathology, veterinary medicine, and comparative anatomy published between 2015 and 2025.

2. Textbooks on veterinary pathology, necropsy techniques, and comparative anatomy.

3. Guidelines and recommendations from professional organizations such as the World Organisation for Animal Health (WOAH), American College of Veterinary Pathologists (ACVP), and European College of Veterinary Pathologists (ECVP).

4. Conference proceedings and research reports from veterinary pathology and diagnostic medicine conferences.

5. Systematic reviews and meta-analyses on ${topic} protocols and practices.

10.8 Data Analysis Plan

Data was analyzed using thematic analysis to identify key themes and patterns across the literature. The analysis focused on:

1. General procedural protocols for ${topic}
2. Species-specific positioning and procedural requirements
3. Equipment and safety requirements
4. Sample collection and preservation methods
5. Documentation and reporting requirements
6. Quality assurance and improvement programs

10.9 Reliability and Validity

Reliability was supported through the use of a systematic search strategy and standardized data extraction procedures. Validity was supported by including only peer-reviewed sources and aligning variable definitions with internationally recognised clinical definitions.

10.10 Ethical Considerations

This research adheres to ethical guidelines for academic research. All sources are properly cited, and the research was conducted with integrity and objectivity. No animal subjects were used in this study, as it is a literature review.

11.0 CHAPTER FOUR: PRESENTATION OF FINDINGS

11.1 Introduction

This chapter presents the findings of the analysis, organized according to the specific objectives of the study. The chapter begins with descriptive findings, followed by detailed procedures for each species, and concludes with a summary of key findings.

11.2 Descriptive Results

The analysis reveals that ${topic} protocols across veterinary species share several common principles while requiring species-specific adaptations. The general protocol includes obtaining history, wearing PPE, conducting external examination, positioning the animal appropriately, making systematic incisions, examining organs in standardized order, collecting samples, documenting findings, and disposing of the carcass properly.

11.3 Species-Specific Protocols

11.3.1 Bovine, Caprine, and Ovine (Cattle, Goats, and Sheep)

Positioning: Left lateral recumbency (lying on the left side). This position is preferred because the rumen remains on the lower side, allowing easier examination of the abdominal organs.

Procedure Steps:

1. Record the complete history of the animal, including age, breed, sex, clinical signs, duration of illness, treatment history, and date of death.

2. Wear appropriate personal protective equipment (PPE), including gloves, boots, overalls, face mask, and safety goggles.

3. Perform a thorough external examination, observing body condition score, skin lesions, eyes, nose, mouth, anus, feet, and any visible injuries or swellings.

4. Make a skin incision from the lower jaw to the anus, following the midline. Reflect the skin away from the body to expose the underlying muscles and tissues.

5. Remove the left forelimb if necessary to improve access to the chest cavity.

6. Open the abdominal cavity carefully, avoiding damage to internal organs.

7. Open the thoracic cavity by cutting through the ribs and removing the rib cage.

8. Examine all organs systematically, including the heart, lungs, liver, spleen, kidneys, rumen, reticulum, omasum, abomasum, intestines, urinary bladder, reproductive organs, and lymph nodes.

9. Open and examine the head and brain if nervous disease is suspected.

10. Collect tissue, blood, or organ samples for laboratory examination where necessary.

11. Record all findings in detail and dispose of the carcass safely by deep burial or incineration according to biosecurity regulations.

11.3.2 Equidae (Horses, Donkeys, and Mules)

Positioning: Left side recumbency (lying on the left side). This position provides appropriate access to both the thoracic and abdominal cavities.

Procedure Steps:

1. Obtain the complete history of the animal.

2. Wear appropriate personal protective equipment.

3. Conduct a thorough external examination.

4. Make a skin incision from the jaw to the pelvis and reflect the skin.

5. Open the abdominal cavity carefully.

6. Open the thoracic cavity by cutting through the ribs.

7. Examine the heart, lungs, liver, spleen, kidneys, stomach, small intestine, cecum, large colon, small colon, urinary bladder, and reproductive organs.

8. Open the skull and examine the brain if neurological disease is suspected.

9. Collect samples for laboratory diagnosis.

10. Record all observations and dispose of the carcass properly.

11.3.3 Porcine (Pigs)

Positioning: Dorsal recumbency (lying on the back). This position provides optimal access to both the thoracic and abdominal cavities.

Procedure Steps:

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

11.3.4 Canine and Feline (Dogs and Cats)

Positioning: Dorsal recumbency (lying on the back). This position provides optimal access to both the thoracic and abdominal cavities.

Procedure Steps:

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

11.3.5 Poultry Species

Positioning: Dorsal recumbency (lying on the back). This position provides optimal access to the thoracic and abdominal cavities.

Procedure Steps:

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

12.0 CHAPTER FIVE: DISCUSSION

12.1 Introduction

This chapter interprets the findings from Chapter Four by situating them within the empirical literature reviewed in Chapter Two. The discussion addresses each specific objective in turn and explores the implications for practice and future research.

12.2 Interpretation of Findings

The findings of this research demonstrate the importance of standardized, species-specific protocols for ${topic} across veterinary species. The analysis reveals that while general principles of systematic examination apply across all species, significant variations in positioning, procedural steps, and anatomical
