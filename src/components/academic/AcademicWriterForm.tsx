// src/components/academic/AcademicWriterForm.tsx
'use client';

import { useState } from 'react';

type AcademicLevel = 'diploma' | 'degree' | 'masters' | 'phd';
type DocumentType = 'essay' | 'research' | 'report' | 'case-study';

const levelLabels: Record<AcademicLevel, string> = {
  diploma: '🎓 Diploma',
  degree: "📘 Bachelor's",
  masters: "🎯 Master's",
  phd: '🔬 PhD'
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

export default function AcademicWriterForm() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('degree');
  const [type, setType] = useState<DocumentType>('essay');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingMessage('⏳ Connecting to Gemini AI...');

    try {
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
      
      console.log('Content received:', data.content.substring(0, 200)); // Debug log
      setResult(data.content);
      const words = data.content.split(/\s+/).length;
      setWordCount(words);
      setLoadingMessage('✅ Done!');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingMessage('');
    } finally {
      setLoading(false);
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

  const downloadAsPDF = () => {
    if (result) {
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Academic Paper</title>
              <style>
                body {
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 12pt;
                  line-height: 1.5;
                  margin: 1in;
                  text-align: justify;
                  max-width: 8.5in;
                  margin-left: auto;
                  margin-right: auto;
                  color: #000000;
                }
                h1, h2, h3, h4, h5, h6 {
                  font-family: 'Times New Roman', Times, serif;
                  color: #000000;
                }
                h1 { font-size: 14pt; font-weight: bold; text-align: center; }
                h2 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
                h3 { font-size: 12pt; font-weight: bold; margin-top: 8pt; margin-bottom: 4pt; }
                p {
                  margin-bottom: 4pt;
                  text-align: justify;
                  line-height: 1.5;
                  color: #000000;
                }
                .title-page {
                  text-align: center;
                  margin-top: 2in;
                  margin-bottom: 2in;
                }
                .title-page h1 {
                  font-size: 18pt;
                  margin-bottom: 12pt;
                }
                .title-page p {
                  text-align: center;
                  margin-bottom: 4pt;
                }
                .page-number {
                  text-align: center;
                  margin-top: 12pt;
                  font-size: 10pt;
                }
                .procedure-step {
                  margin-bottom: 2pt;
                  padding-left: 20pt;
                  text-indent: -20pt;
                }
              </style>
            </head>
            <body>
              ${result.split('\n').map(line => {
                if (line.match(/^\d+\.0\s/)) {
                  return `<h2>${line}</h2>`;
                }
                if (line.match(/^\d+\.\d+\s/)) {
                  return `<h3>${line}</h3>`;
                }
                if (line.match(/^\d+\.\s/)) {
                  return `<p class="procedure-step">${line}</p>`;
                }
                if (line.trim()) {
                  return `<p>${line}</p>`;
                }
                return '<br>';
              }).join('')}
              <div class="page-number">${new Date().getFullYear()} | Page 1</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 1000);
      }
    }
  };

  // Helper function to render content with proper formatting - FIXED with explicit colors
  const renderContent = () => {
    if (!result) return null;

    console.log('Rendering content, length:', result.length); // Debug log

    const lines = result.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      // Skip empty lines but add spacing
      if (!line.trim()) {
        elements.push(<br key={`br-${index}`} />);
        return;
      }

      // Main headings (1.0, 2.0, etc.)
      if (line.match(/^\d+\.0\s/)) {
        elements.push(
          <h2 key={index} className="text-xl font-bold mt-6 mb-3" style={{ color: '#1a1a1a' }}>
            {line}
          </h2>
        );
        return;
      }

      // Subheadings (1.1, 1.2, etc.)
      if (line.match(/^\d+\.\d+\s/)) {
        elements.push(
          <h3 key={index} className="text-lg font-bold mt-4 mb-2" style={{ color: '#2d2d2d' }}>
            {line}
          </h3>
        );
        return;
      }

      // Numbered steps (1., 2., 3., etc.)
      if (line.match(/^\d+\.\s/)) {
        elements.push(
          <p key={index} className="mb-1 leading-relaxed text-justify" style={{ paddingLeft: '20pt', textIndent: '-20pt', color: '#1a1a1a' }}>
            {line}
          </p>
        );
        return;
      }

      // Bullet points
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        elements.push(
          <p key={index} className="mb-1 leading-relaxed text-justify" style={{ paddingLeft: '20pt', color: '#1a1a1a' }}>
            {line}
          </p>
        );
        return;
      }

      // Regular paragraphs - with explicit color
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
          <label className="block font-semibold text-gray-700 mb-2">
            Academic Level
          </label>
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
          <label className="block font-semibold text-gray-700 mb-2">
            Document Type
          </label>
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
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingMessage}
              </span>
              <span className="text-xs text-green-100">This may take a moment for comprehensive content</span>
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

      {/* RESULTS - Displayed directly below the button with visible text */}
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
              >
                📄 Download PDF
              </button>
            </div>
          </div>

          {/* Content displayed directly - NO BOX, with visible text */}
          <div style={{ 
            fontFamily: 'Times New Roman, Times, serif', 
            fontSize: '12pt', 
            lineHeight: '1.5',
            color: '#1a1a1a',
            backgroundColor: '#ffffff'
          }}>
            {renderContent()}
          </div>

          <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
            Generated by VetSphere Academic Writer • {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
