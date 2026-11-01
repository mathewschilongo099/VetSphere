'use client';

import { useState } from 'react';

interface Item {
  where: string;
  url: string;
  status: string;
  reason?: string;
  newUrl?: string;
}
interface Row {
  slug: string;
  title?: string;
  subject?: string;
  items?: Item[];
  changed?: boolean;
  error?: string;
}

const LABELS: Record<string, string> = {
  ok: '✅ correct',
  wrong: '❌ wrong picture',
  unchecked: '⚠️ could not be checked',
  replaced: '🔁 replaced',
  removed: '🗑️ removed',
  'no-replacement': '❌ wrong, no replacement found',
  unreachable: '❌ picture not loading',
};

export default function ImageAuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');

  const run = async (apply: boolean) => {
    if (apply && !confirm('Replace every wrong picture automatically? Each fix is saved to GitHub.')) return;
    setRunning(true);
    setRows([]);
    setMessage('');
    try {
      const list = await fetch('/api/admin-tools/fix-images');
      if (list.status === 401) {
        setMessage('Please log in at /admin first, then come back to this page.');
        return;
      }
      const data = await list.json();
      if (!data.ok) throw new Error(data.error || 'Could not list articles');
      const slugs: string[] = data.slugs;

      for (let i = 0; i < slugs.length; i++) {
        setProgress(`Checking ${i + 1} of ${slugs.length}: ${slugs[i]}`);
        let row: Row = { slug: slugs[i] };
        try {
          const res = await fetch('/api/admin-tools/fix-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: slugs[i], apply }),
          });
          const out = await res.json();
          row = out.ok ? { slug: slugs[i], title: out.title, subject: out.subject, items: out.results, changed: out.changed } : { slug: slugs[i], error: out.error || `Error ${res.status}` };
        } catch (error) {
          row = { slug: slugs[i], error: error instanceof Error ? error.message : 'Request failed' };
        }
        setRows((prev) => [...prev, row]);
      }
      setProgress('');
      setMessage(apply ? 'Done. Your site is rebuilding with the fixed pictures.' : 'Done. Nothing was changed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setRunning(false);
    }
  };

  const problems = rows.filter((r) => r.error || r.items?.some((i) => !['ok', 'replaced', 'removed'].includes(i.status)));

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <a href="/admin" className="text-green-400 text-sm hover:underline">← Back to admin</a>
          <h1 className="text-2xl font-bold mt-2">🖼️ Check article pictures</h1>
          <p className="text-gray-400 text-sm mt-1">
            An AI looks at every picture in every article and confirms it shows the right animal (for example chickens in a chicken article).
            Wrong pictures can be replaced automatically.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={() => run(false)} disabled={running} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 font-bold px-5 py-3 rounded-xl">
            🔍 Check only
          </button>
          <button onClick={() => run(true)} disabled={running} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 font-bold px-5 py-3 rounded-xl">
            🔧 Check and fix
          </button>
        </div>

        {progress && <p className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300">⏳ {progress}</p>}
        {message && <p className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-yellow-300">{message}</p>}
        {rows.length > 0 && (
          <p className="text-sm text-gray-400">
            {rows.length} checked · {problems.length} with problems
          </p>
        )}

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.slug} className="bg-gray-800 rounded-xl p-4">
              <p className="font-semibold text-sm">{row.title || row.slug}</p>
              {row.subject && <p className="text-xs text-gray-400">Detected animal: {row.subject}</p>}
              {row.error && <p className="text-red-400 text-sm mt-1">❌ {row.error}</p>}
              {row.items?.map((item, i) => (
                <div key={i} className="mt-2 text-sm">
                  <span className="text-gray-400">{item.where === 'hero' ? 'Main picture' : 'Picture in article'}: </span>
                  <span>{LABELS[item.status] || item.status}</span>
                  {item.reason && item.status !== 'ok' && <p className="text-xs text-gray-400 mt-0.5">{item.reason}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
