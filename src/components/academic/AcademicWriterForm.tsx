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
  diploma: '2nd year college, 1500-2000 words',
  degree: '3rd/4th year, 2000-3000 words',
  masters: 'Graduate level, 3000-4000 words',
  phd: 'Doctorate level, 4000-5000 words'
};

export default function AcademicWriterForm() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('degree');
  const [type, setType] = useState<DocumentType>('essay');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showFullPage, setShowFullPage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/academic-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, type })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to generate');
      
      setResult(data.content);
      const words = data.content.split(/\s+/).length;
      setWordCount(words);
      setShowFullPage(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      const cleanResult = result
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '');
      navigator.clipboard.writeText(cleanResult);
      alert('✅ Content copied to clipboard!');
    }
  };

  const downloadAsTXT = () => {
    if (result) {
      const cleanResult = result
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '');
      const blob = new Blob([cleanResult], { type: 'text/plain;charset=utf-8' });
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
      const cleanResult = result
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '');
      
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(`
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
                }
                h1 { font-size: 14pt; font-weight: bold; text-align: center; }
                h2 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
                h3 { font-size: 12pt; font-weight: bold; margin-top: 8pt; margin-bottom: 4pt; }
                p {
                  margin-bottom: 4pt;
                  text-align: justify;
                  line-height: 1.5;
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
                .abstract {
                  margin-bottom: 12pt;
                }
                .abstract strong {
                  font-weight: bold;
                }
                .references {
                  margin-top: 12pt;
                }
                .references p {
                  text-indent: -0.5in;
                  padding-left: 0.5in;
                  margin-bottom: 4pt;
                }
                .section {
                  margin-bottom: 8pt;
                }
                .page-number {
                  text-align: center;
                  margin-top: 12pt;
                  font-size: 10pt;
                }
              </style>
            </head>
            <body>
              ${cleanResult.split('\n').map(line => {
                if (line.match(/^1\.0\s+Cover\s+Page/i)) {
                  return `<div class="title-page"><h1>${cleanResult.split('\n').find(l => l.trim() && !l.match(/^\d+\./)) || 'Academic Paper'}</h1><p>VetSphere Academic Writer</p><p>${new Date().toLocaleDateString()}</p></div>`;
                }
                if (line.match(/^\d+\.0\s/)) {
                  return `<h2 class="section">${line}</h2>`;
                }
                if (line.match(/^\d+\.\d+\s/)) {
                  return `<h3 class="section">${line}</h3>`;
                }
                if (line.toLowerCase().includes('abstract') && line.length < 30) {
                  return `<div class="abstract"><strong>Abstract</strong><br>${line.replace(/Abstract/i, '').trim()}</div>`;
                }
                if (line.match(/^References/i)) {
                  return `<h2 class="references">${line}</h2>`;
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
          printWindow.print();
        }, 1000);
      }
    }
  };

  // Full page view
  if (showFullPage && result) {
    const cleanResult = result
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '');

    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        {/* Header with controls */}
        <div className="sticky top-0 bg-white border-b shadow-sm z-10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg text-gray-900">📄 Generated {typeLabels[type]}</h2>
            <div className="text-sm text-gray-500">
              {levelLabels[level]} • {wordCount} words
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFullPage(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
            >
              ✕ Close
            </button>
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

        {/* Full page content */}
        <div className="max-w-4xl mx-auto px-8 py-12">
          {cleanResult.split('\n').map((line, i) => {
            if (!line.trim() && i === 0) return null;
            
            // Title Page
            if (line.match(/^1\.0\s+Cover\s+Page/i)) {
              return (
                <div key={i} className="text-center my-16">
                  <h1 className="text-2xl font-bold mb-2">{cleanResult.split('\n').find(l => l.trim() && !l.match(/^\d+\./)) || 'Academic Paper'}</h1>
                  <p className="text-lg mb-1">VetSphere Academic Writer</p>
                  <p className="text-base">{new Date().toLocaleDateString()}</p>
                </div>
              );
            }
            
            // Main headings
            if (line.match(/^\d+\.0\s/)) {
              return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line}</h2>;
            }
            
            // Subheadings
            if (line.match(/^\d+\.\d+\s/)) {
              return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line}</h3>;
            }
            
            // Abstract
            if (line.toLowerCase().includes('abstract') && line.length < 30) {
              return <div key={i} className="italic mt-4 mb-2"><strong>Abstract</strong><br />{line.replace(/Abstract/i, '').trim()}</div>;
            }
            
            // References
            if (line.match(/^References/i)) {
              return <h2 key={i} className="text-xl font-bold mt-8 mb-4">{line}</h2>;
            }
            
            // Regular paragraphs
            if (line.trim()) {
              return <p key={i} className="mb-2 leading-relaxed text-justify">{line}</p>;
            }
            
            return <br key={i} />;
          })}
          
          <div className="text-center text-sm text-gray-500 mt-12 pt-4 border-t">
            Generated by VetSphere Academic Writer • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            What's your topic or research question?
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
            Be specific for better results
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
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating your academic paper...
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
    </div>
  );
}
