// src/components/academic/AcademicWriterForm.tsx
'use client';

import { useState } from 'react';
import type jsPDF from 'jspdf';

type AcademicLevel = 'diploma' | 'degree' | 'masters' | 'phd';
type DocumentType = 'essay' | 'research' | 'report' | 'case-study';

const levelLabels: Record<AcademicLevel, string> = {
  diploma: '🎓 Diploma',
  degree: "📘 Bachelor's",
  masters: "🎯 Master's",
  phd: '🔬 PhD'
};

const levelDegreeNames: Record<AcademicLevel, string> = {
  diploma: 'Diploma',
  degree: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: 'PhD'
};

const typeLabels: Record<DocumentType, string> = {
  essay: 'Assignment',
  research: 'Research Paper',
  report: 'Report',
  'case-study': 'Case Study'
};

const levelDescriptions: Record<AcademicLevel, string> = {
  diploma: 'Foundational level with practical focus',
  degree: 'Comprehensive analysis with evidence-based approach',
  masters: 'Advanced research with critical analysis',
  phd: 'Original contribution with extensive literature review'
};

// ============================================================
// PDF GENERATION
// ============================================================
// Real, direct-download PDF (no print dialog), built with jsPDF instead of
// window.print(). Because we lay the document out programmatically instead
// of screenshotting HTML, we can also compute a genuinely accurate table of
// contents: a first "dry run" pass measures which page each heading actually
// lands on, then a second real pass renders the TOC with correct numbers.
//
// Requires: npm install jspdf

type Block = { type: 'h2' | 'h3' | 'bare' | 'para' | 'blank'; text: string };

function parseBlocks(content: string): Block[] {
  return content.split('\n').map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return { type: 'blank', text: '' } as Block;
    if (/^\d+\.0\s+/.test(trimmed)) return { type: 'h2', text: trimmed } as Block;
    if (/^\d+\.\d+(\.\d+)?\s+/.test(trimmed)) return { type: 'h3', text: trimmed } as Block;
    if (/^(REFERENCES|APPENDICES)$/i.test(trimmed)) {
      return { type: 'bare', text: trimmed.toUpperCase() } as Block;
    }
    return { type: 'para', text: trimmed } as Block;
  });
}

// The AI's own front-matter text includes a guessed Table of Contents with
// dot-leader placeholder lines (e.g. "1.0 Introduction ..... 1"). We strip
// that out entirely and replace it with a computed one.
function stripFakeToc(blocks: Block[]): Block[] {
  return blocks.filter(
    (b) => !/\.{4,}/.test(b.text) && !/^5\.0\s+Table of Contents/i.test(b.text.trim())
  );
}

function splitFrontAndBody(blocks: Block[]): { front: Block[]; body: Block[] } {
  const idx = blocks.findIndex((b) => b.type === 'h2' && /^1\.0\s+Introduction\b/i.test(b.text));
  if (idx === -1) return { front: blocks, body: [] };
  return { front: blocks.slice(0, idx), body: blocks.slice(idx) };
}

const PAGE_MARGIN = 72; // 1 inch, matches your standard formatting rules

function drawBlocks(
  doc: jsPDF,
  blocks: Block[],
  startY: number,
  recordHeadingPages: boolean
): { finalY: number; headings: { text: string; page: number }[] } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - PAGE_MARGIN * 2;
  const bottom = pageHeight - PAGE_MARGIN;

  let y = startY;
  const headings: { text: string; page: number }[] = [];

  for (const block of blocks) {
    if (block.type === 'blank') {
      y += 9;
      continue;
    }

    let fontStyle: 'normal' | 'bold' = 'normal';
    let size = 12;
    let gapBefore = 0;
    const gapAfter = 6;
    let isHeading = false;

    if (block.type === 'h2') {
      fontStyle = 'bold';
      size = 13;
      gapBefore = 14;
      isHeading = true;
    } else if (block.type === 'h3') {
      fontStyle = 'bold';
      size = 12;
      gapBefore = 10;
      isHeading = true;
    } else if (block.type === 'bare') {
      fontStyle = 'bold';
      size = 13;
      gapBefore = 14;
      isHeading = true;
    }

    doc.setFont('times', fontStyle);
    doc.setFontSize(size);
    const lineH = size * 1.5; // 1.5 line spacing per your formatting rules

    y += gapBefore;
    if (y + lineH > bottom) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    if (isHeading && recordHeadingPages) {
      headings.push({ text: block.text, page: doc.getNumberOfPages() });
    }

    const lines = doc.splitTextToSize(block.text, maxWidth) as string[];
    lines.forEach((ln, i) => {
      if (y + lineH > bottom) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      const isLast = i === lines.length - 1;
      if (!isHeading && !isLast) {
        // Justified body text per your standard formatting rules.
        doc.text(ln, PAGE_MARGIN, y, { maxWidth, align: 'justify' } as any);
      } else {
        doc.text(ln, PAGE_MARGIN, y);
      }
      y += lineH;
    });

    y += gapAfter;
  }

  return { finalY: y, headings };
}

function renderToc(
  doc: jsPDF,
  entries: { label: string; page: number }[],
  startY: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - PAGE_MARGIN * 2;
  const bottom = pageHeight - PAGE_MARGIN;

  let y = startY;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const lineH = 12 * 1.5;
  const dotChar = '.';
  const dotWidth = doc.getTextWidth(dotChar);

  for (const entry of entries) {
    if (y + lineH > bottom) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    const pageStr = String(entry.page);
    const pageStrWidth = doc.getTextWidth(pageStr);
    const labelMaxWidth = maxWidth - pageStrWidth - 20;
    const labelLines = doc.splitTextToSize(entry.label, labelMaxWidth) as string[];

    labelLines.forEach((ln, i) => {
      if (y + lineH > bottom) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      if (i === 0) {
        const labelWidth = doc.getTextWidth(ln);
        const dotsWidth = Math.max(0, maxWidth - labelWidth - pageStrWidth - 10);
        const numDots = Math.max(3, Math.floor(dotsWidth / dotWidth));
        doc.text(ln, PAGE_MARGIN, y);
        doc.text(dotChar.repeat(numDots), PAGE_MARGIN + labelWidth + 4, y);
        doc.text(pageStr, pageWidth - PAGE_MARGIN - pageStrWidth, y);
      } else {
        doc.text(ln, PAGE_MARGIN + 12, y);
      }
      y += lineH;
    });
  }
}

async function generateAcademicPdf(
  content: string,
  topic: string,
  level: AcademicLevel
): Promise<void> {
  const { default: JsPDF } = await import('jspdf');

  const blocks = stripFakeToc(parseBlocks(content));
  const { front, body } = splitFrontAndBody(blocks);

  const doc = new JsPDF({ unit: 'pt', format: 'letter' }) as jsPDF;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Title page ---
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(topic.toUpperCase(), pageWidth - PAGE_MARGIN * 2) as string[];
  let y = 220;
  titleLines.forEach((ln) => {
    doc.text(ln, pageWidth / 2, y, { align: 'center' } as any);
    y += 26;
  });
  doc.setFont('times', 'normal');
  doc.setFontSize(13);
  y += 60;
  ['VetSphere Academic Writer', levelDegreeNames[level], new Date().toLocaleDateString()].forEach(
    (line) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' } as any);
      y += 20;
    }
  );

  // --- Front matter (Declaration, Dedication, Acknowledgements, Abstract, Abbreviations) ---
  doc.addPage();
  const declIdx = front.findIndex((b) => b.type === 'h2' && /^2\.0\s+Declaration/i.test(b.text));
  const frontMatterBlocks = declIdx === -1 ? front : front.slice(declIdx);
  drawBlocks(doc, frontMatterBlocks, PAGE_MARGIN, false);
  const frontMatterPageCount = doc.getNumberOfPages();

  // --- Body: measurement-only pass to find each heading's real page ---
  const { default: ScratchJsPDF } = await import('jspdf');
  const scratchDoc = new ScratchJsPDF({ unit: 'pt', format: 'letter' }) as jsPDF;
  const { headings: bodyHeadings } = drawBlocks(scratchDoc, body, PAGE_MARGIN, true);

  // --- TOC: measurement pass to find how many pages the TOC itself needs ---
  const scratchTocDoc = new ScratchJsPDF({ unit: 'pt', format: 'letter' }) as jsPDF;
  scratchTocDoc.setFont('times', 'bold');
  scratchTocDoc.setFontSize(14);
  scratchTocDoc.text('TABLE OF CONTENTS', scratchTocDoc.internal.pageSize.getWidth() / 2, PAGE_MARGIN, {
    align: 'center',
  } as any);
  renderToc(
    scratchTocDoc,
    bodyHeadings.map((h) => ({ label: h.text, page: h.page })),
    PAGE_MARGIN + 30
  );
  const tocPageCount = scratchTocDoc.getNumberOfPages();

  // --- Real TOC render, now with correct final page numbers ---
  doc.addPage();
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('TABLE OF CONTENTS', pageWidth / 2, PAGE_MARGIN, { align: 'center' } as any);
  const realEntries = bodyHeadings.map((h) => ({
    label: h.text,
    page: frontMatterPageCount + tocPageCount + h.page,
  }));
  renderToc(doc, realEntries, PAGE_MARGIN + 30);

  // --- Real body render ---
  doc.addPage();
  drawBlocks(doc, body, PAGE_MARGIN, false);

  // --- Page numbers on every page ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(String(p), pageWidth / 2, doc.internal.pageSize.getHeight() - 40, {
      align: 'center',
    } as any);
  }

  const filename = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${level}.pdf`;
  doc.save(filename);
}

// ============================================================
// COMPONENT
// ============================================================
export default function AcademicWriterForm() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('degree');
  const [type, setType] = useState<DocumentType>('essay');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  // Tracks "chapter 3 of 7" style progress while a research paper is being
  // generated one chapter per request. Null outside of that flow.
  const [chapterProgress, setChapterProgress] = useState<{ current: number; total: number } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setChapterProgress(null);

    try {
      if (type === 'research') {
        // Research papers are generated one chapter per request so each
        // call stays well under Vercel's 60s limit. Each chapter's prompt
        // is fed the previous chapters' context (contextForNextChapter)
        // so the title, objectives, and findings stay consistent instead
        // of every chapter re-inventing its own version of the paper.
        let allContent = '';
        let previousContext = '';
        let chapterIndex = 0;
        let isLastChapter = false;
        let totalChapters = 7; // corrected as soon as the first response arrives

        while (!isLastChapter) {
          setLoadingMessage(`📝 Writing chapter ${chapterIndex + 1} of ${totalChapters}...`);
          setChapterProgress({ current: chapterIndex + 1, total: totalChapters });

          const response = await fetch('/api/academic-writer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic,
              level,
              type,
              chapterIndex,
              previousContext
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                `Failed while generating chapter ${chapterIndex + 1}. Earlier chapters are still shown below.`
            );
          }

          allContent += (allContent ? '\n\n' : '') + data.content;
          previousContext = data.contextForNextChapter;
          isLastChapter = data.isLastChapter;
          chapterIndex = data.nextChapterIndex;
          totalChapters = data.totalChapters;

          // Show progress as each chapter lands rather than one long blank wait.
          setResult(allContent);
          setWordCount(allContent.split(/\s+/).length);
        }

        setLoadingMessage('✅ Done!');
      } else {
        // Assignment / Report / Case Study: unchanged, single call.
        setLoadingMessage('⏳ Connecting to AI provider...');
        setTimeout(() => setLoadingMessage('🧠 Analyzing your topic...'), 2000);
        setTimeout(() => setLoadingMessage('📝 Generating comprehensive content...'), 4000);
        setTimeout(() => setLoadingMessage('🔍 Adding citations and references...'), 6000);
        setTimeout(() => setLoadingMessage('✨ Finalizing your academic paper...'), 8000);

        const response = await fetch('/api/academic-writer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, level, type })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to generate');

        setResult(data.content);
        setWordCount(data.content.split(/\s+/).length);
        setLoadingMessage('✅ Done!');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingMessage('');
    } finally {
      setLoading(false);
      setChapterProgress(null);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('✅ Content copied to clipboard!');
    }
  };

  const downloadAsTXT = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.toLowerCase().replace(/\s+/g, '-')}-${level}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadAsPDF = async () => {
    if (!result) return;
    setPdfGenerating(true);
    try {
      await generateAcademicPdf(result, topic, level);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Sorry, the PDF could not be generated. Please try the TXT download instead.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Helper function to render content with proper formatting
  const renderContent = () => {
    if (!result) return null;

    const lines = result.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) {
        elements.push(<br key={`br-${index}`} />);
        return;
      }

      if (line.match(/^\d+\.0\s/)) {
        elements.push(
          <h2 key={index} className="text-xl font-bold mt-6 mb-3" style={{ color: '#1a1a1a' }}>
            {line}
          </h2>
        );
        return;
      }

      if (line.match(/^\d+\.\d+\s/)) {
        elements.push(
          <h3 key={index} className="text-lg font-bold mt-4 mb-2" style={{ color: '#2d2d2d' }}>
            {line}
          </h3>
        );
        return;
      }

      if (line.match(/^\d+\.\s/)) {
        elements.push(
          <p
            key={index}
            className="mb-1 leading-relaxed text-justify"
            style={{ paddingLeft: '20pt', textIndent: '-20pt', color: '#1a1a1a' }}
          >
            {line}
          </p>
        );
        return;
      }

      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        elements.push(
          <p
            key={index}
            className="mb-1 leading-relaxed text-justify"
            style={{ paddingLeft: '20pt', color: '#1a1a1a' }}
          >
            {line}
          </p>
        );
        return;
      }

      elements.push(
        <p key={index} className="mb-2 leading-relaxed text-justify" style={{ color: '#1a1a1a' }}>
          {line}
        </p>
      );
    });

    return elements;
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            What is your topic or research question?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="e.g., Procedure for postmortem examination in bovine, caprine, ovine, equine, porcine, canine, feline, and poultry"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            style={{ color: '#1a1a1a', backgroundColor: '#ffffff' }}
          />
          <p className="text-sm text-gray-500 mt-1">
            Be specific for better results — the AI will write comprehensive content
          </p>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">Academic Level</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(levelLabels) as AcademicLevel[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition text-left ${
                  level === l
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div>{levelLabels[l]}</div>
                <div className={`text-xs ${level === l ? 'text-green-100' : 'text-gray-400'}`}>
                  {levelDescriptions[l]}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2">Document Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(typeLabels) as DocumentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                  type === t
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className={`w-full font-bold py-4 rounded-xl transition shadow-lg ${
            loading
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <span className="flex flex-col items-center gap-2">
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {loadingMessage}
              </span>
              <span className="text-xs text-green-100">
                {chapterProgress
                  ? 'Writing your research paper chapter by chapter — this stays under the timeout on Vercel Hobby'
                  : 'This may take a moment for comprehensive content'}
              </span>
              {chapterProgress && (
                <div className="w-full max-w-xs h-1.5 bg-green-800/40 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (chapterProgress.current / chapterProgress.total) * 100
                      )}%`
                    }}
                  />
                </div>
              )}
            </span>
          ) : (
            '📝 Generate Academic Paper'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <div className="font-semibold">Error:</div>
          {error}
          <div className="text-sm mt-2 text-red-600">
            Tip: Try refreshing or using a different topic.
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900">📄 Generated {typeLabels[type]}</h3>
              <div className="text-sm text-gray-500">
                {levelLabels[level]} • {wordCount} words
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
              >
                📋 Copy
              </button>
              <button
                onClick={downloadAsTXT}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
              >
                ⬇️ TXT
              </button>
              <button
                onClick={downloadAsPDF}
                disabled={pdfGenerating}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition"
              >
                {pdfGenerating ? '⏳ Generating PDF...' : '⬇️ PDF'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-10 max-h-[70vh] overflow-y-auto shadow-sm">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}
