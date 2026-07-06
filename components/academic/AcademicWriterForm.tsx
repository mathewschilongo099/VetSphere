// components/academic/AcademicWriterForm.tsx
'use client';

import { useState } from 'react';

type AcademicLevel = 'diploma' | 'degree' | 'masters' | 'phd';
type DocumentType = 'essay' | 'research' | 'report' | 'case-study';

const levelLabels: Record<AcademicLevel, string> = {
  diploma: '🎓 Diploma',
  degree: '📘 Bachelor\'s',
  masters: '🎯 Master\'s',
  phd: '🔬 PhD'
};

const typeLabels: Record<DocumentType, string> = {
  essay: 'Essay',
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
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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

  const downloadAsMarkdown = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.toLowerCase().replace(/\s+/g, '-')}-${level}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadAsPDF = () => {
    if (result) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Academic Paper</title></head>
            <body style="font-family: Times New Roman, serif; padding: 1in; line-height: 1.6;">
              <pre style="white-space: pre-wrap; font-family: Times New Roman, serif; font-size: 12pt;">${result}</pre>
              <script>
                window.onload = function() { window.print(); }
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            What's your topic or research question?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="e.g., The impact of climate change on livestock farming in Sub-Saharan Africa"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
          <p className="text-sm text-gray-400 mt-1">
            Be specific for better results
          </p>
        </div>

        {/* Academic Level */}
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

        {/* Document Type */}
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

        {/* Submit */}
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

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <div className="font-semibold">Error:</div>
          {error}
          <div className="text-sm mt-2 text-red-600">
            Tip: Try refreshing or using a different topic.
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 animate-fade-in">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <div>
              <h3 className="font-bold text-lg">📄 Generated {typeLabels[type]}</h3>
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
                onClick={downloadAsMarkdown}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
              >
                ⬇️ Download (MD)
              </button>
              <button
                onClick={downloadAsPDF}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
              >
                📄 PDF
              </button>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-6 max-h-[600px] overflow-y-auto prose prose-sm max-w-none shadow-inner">
            {result.split('\n').map((line, i) => (
              <p key={i} className="mb-2 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
