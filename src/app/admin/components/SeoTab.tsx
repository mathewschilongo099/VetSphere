'use client';

import { useMemo, useState } from 'react';
import { errMsg, post, type AdminArticle } from './api';
import { SEO_ISSUES, auditArticles, type SeoIssueId } from './seo';
import { Card } from './ui';

interface Change {
  name: string;
  title?: { from: string; to: string };
  description?: { from: string; to: string };
}

export default function SeoTab({
  articles,
  onEdit,
  onChanged,
}: {
  articles: AdminArticle[];
  onEdit: (name: string) => void;
  onChanged?: () => void;
}) {
  const [issue, setIssue] = useState<'all' | SeoIssueId>('all');
  const [preview, setPreview] = useState<Change[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Drafts are still being written, so they are not checked.
  const pool = useMemo(() => articles.filter((a) => a.status !== 'draft'), [articles]);
  const audit = useMemo(() => auditArticles(pool), [pool]);

  const counts = useMemo(() => {
    const map = new Map<SeoIssueId, number>();
    audit.forEach((list) => list.forEach((id) => map.set(id, (map.get(id) || 0) + 1)));
    return map;
  }, [audit]);

  const score = pool.length ? Math.round(((pool.length - audit.size) / pool.length) * 100) : 100;
  const flagged = pool.filter((a) => audit.has(a.name) && (issue === 'all' || audit.get(a.name)?.includes(issue)));

  // Title and description length problems can be repaired automatically.
  const fixable = (counts.get('titleLength') || 0) + (counts.get('descLength') || 0) + (counts.get('noDescription') || 0);

  const runFix = async (dryRun: boolean) => {
    setBusy(true);
    setMessage('');
    try {
      const res = await post<{ ok?: boolean; error?: string; changes?: Change[] }>('/api/articles/seo-fix', { dryRun });
      if (res.error || !res.ok) {
        setMessage(`❌ ${res.error || 'Could not fix the articles.'}`);
      } else if (dryRun) {
        if (!res.changes?.length) setMessage('Nothing to fix automatically.');
        setPreview(res.changes?.length ? res.changes : null);
      } else {
        setPreview(null);
        setMessage(`✅ Fixed ${res.changes?.length ?? 0} articles. The site is rebuilding, so changes show up in a minute or two.`);
        onChanged?.();
      }
    } catch (error) {
      setMessage(`❌ ${errMsg(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">🔎 SEO check</h2>

      <Card>
        <div className="flex items-center gap-4">
          <p className={`text-4xl font-bold ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {score}%
          </p>
          <p className="text-sm text-gray-400">
            of {pool.length} live and scheduled articles have no SEO problems. {audit.size} need attention.
          </p>
        </div>
      </Card>

      {fixable > 0 && !preview && (
        <Card>
          <p className="text-sm text-gray-300 mb-3">
            Titles and meta descriptions with the wrong length can be fixed automatically. Nothing is saved until you
            have seen the list and confirmed it.
          </p>
          <button
            onClick={() => runFix(true)}
            disabled={busy}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl"
          >
            {busy ? '⏳ Checking...' : '✨ Fix titles and descriptions'}
          </button>
        </Card>
      )}

      {message && <p className="text-sm text-gray-200">{message}</p>}

      {preview && (
        <Card>
          <p className="text-sm font-semibold mb-3">{preview.length} articles will change:</p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {preview.map((c) => (
              <div key={c.name} className="text-xs bg-gray-900 rounded-lg p-3 space-y-1">
                {c.title && (
                  <p>
                    <span className="text-gray-500">Title: </span>
                    <span className="text-red-300 line-through">{c.title.from}</span>
                    <br />
                    <span className="text-green-300">{c.title.to}</span>
                  </p>
                )}
                {c.description && (
                  <p>
                    <span className="text-gray-500">Description: </span>
                    {c.description.from && <span className="text-red-300 line-through">{c.description.from}</span>}
                    {c.description.from && <br />}
                    <span className="text-green-300">{c.description.to}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => runFix(false)}
              disabled={busy}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              {busy ? '⏳ Saving...' : `Save ${preview.length} fixes`}
            </button>
            <button
              onClick={() => setPreview(null)}
              disabled={busy}
              className="bg-gray-700 text-gray-200 text-sm px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {counts.size > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIssue('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${issue === 'all' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            All problems ({audit.size})
          </button>
          {(Object.keys(SEO_ISSUES) as SeoIssueId[])
            .filter((id) => counts.has(id))
            .map((id) => (
              <button
                key={id}
                onClick={() => setIssue(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${issue === id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {SEO_ISSUES[id]} ({counts.get(id)})
              </button>
            ))}
        </div>
      )}

      {audit.size === 0 && pool.length > 0 && (
        <p className="text-center text-green-400 py-6">✅ No SEO problems found.</p>
      )}

      <div className="space-y-2">
        {flagged.map((a) => (
          <div key={a.name} className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <p className="text-sm text-gray-100 flex-1">{a.title || a.name}</p>
              <button onClick={() => onEdit(a.name)} className="text-blue-400 text-xs hover:underline shrink-0">
                ✏️ Fix
              </button>
            </div>
            <ul className="mt-1 space-y-0.5">
              {(audit.get(a.name) || []).map((id) => (
                <li key={id} className="text-xs text-yellow-300">
                  • {SEO_ISSUES[id]}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
