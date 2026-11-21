'use client';

import { useMemo, useState } from 'react';
import type { AdminArticle } from './api';
import { SEO_ISSUES, auditArticles, type SeoIssueId } from './seo';
import { Card } from './ui';

export default function SeoTab({
  articles,
  onEdit,
}: {
  articles: AdminArticle[];
  onEdit: (name: string) => void;
}) {
  const [issue, setIssue] = useState<'all' | SeoIssueId>('all');

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
