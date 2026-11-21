'use client';

import { useMemo } from 'react';
import type { AdminArticle } from './api';
import { auditArticles } from './seo';
import type { Tab } from './types';
import { Card, Loading, StatusBadge } from './ui';

const QUICK: { tab: Tab; icon: string; title: string; desc: string }[] = [
  { tab: 'write', icon: '✍️', title: 'Write an article', desc: 'Generate, change the photo, publish or schedule' },
  { tab: 'manage', icon: '🗂️', title: 'Manage articles', desc: 'Filter, bulk edit, feature and delete' },
  { tab: 'taxonomy', icon: '🏷️', title: 'Categories and tags', desc: 'Rename or merge across all articles' },
  { tab: 'media', icon: '🖼️', title: 'Media library', desc: 'Upload, delete and swap photos' },
  { tab: 'seo', icon: '🔎', title: 'SEO check', desc: 'Find weak titles and descriptions' },
  { tab: 'site', icon: '⚙️', title: 'Site control', desc: 'Rebuild, backup and auto-publish' },
];

export default function DashboardTab({
  articles,
  loading,
  onReload,
  onOpen,
  onEdit,
}: {
  articles: AdminArticle[];
  loading: boolean;
  onReload: () => void;
  onOpen: (tab: Tab) => void;
  onEdit: (name: string) => void;
}) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const live = articles.filter((a) => a.status === 'published');
    const words = live.reduce((sum, a) => sum + a.words, 0);
    const perCategory = new Map<string, number>();
    for (const a of articles) {
      if (a.category) perCategory.set(a.category, (perCategory.get(a.category) || 0) + 1);
    }
    return {
      total: articles.length,
      published: live.length,
      drafts: articles.filter((a) => a.status === 'draft').length,
      scheduled: articles.filter((a) => a.status === 'scheduled').length,
      featured: live.filter((a) => a.featured).length,
      today: articles.filter((a) => a.date.slice(0, 10) === today).length,
      month: articles.filter((a) => a.date.slice(0, 7) === month).length,
      avgWords: live.length ? Math.round(words / live.length) : 0,
      seo: auditArticles(articles.filter((a) => a.status !== 'draft')).size,
      categories: Array.from(perCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    };
  }, [articles]);

  const cards = [
    { value: stats.total, label: 'Total articles', color: 'text-green-400' },
    { value: stats.published, label: 'Live on the site', color: 'text-emerald-400' },
    { value: stats.drafts, label: 'Drafts', color: 'text-yellow-400' },
    { value: stats.scheduled, label: 'Scheduled', color: 'text-blue-400' },
    { value: stats.featured, label: 'Featured', color: 'text-purple-400' },
    { value: stats.month, label: 'Added this month', color: 'text-pink-400' },
  ];
  const maxCategory = Math.max(1, ...stats.categories.map(([, n]) => n));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Overview</h2>
        <button onClick={onReload} disabled={loading} className="text-green-400 text-sm hover:underline">
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(({ value, label, color }) => (
          <div key={label} className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{loading && articles.length === 0 ? '...' : value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {(stats.drafts > 0 || stats.scheduled > 0 || stats.seo > 0 || stats.today > 0) && (
        <Card title="Needs attention">
          <div className="space-y-2 text-sm">
            {stats.today > 0 && <p className="text-gray-300">📅 {stats.today} article(s) dated today.</p>}
            {stats.drafts > 0 && (
              <button onClick={() => onOpen('manage')} className="block text-yellow-300 hover:underline text-left">
                📝 {stats.drafts} draft(s) waiting to be published
              </button>
            )}
            {stats.scheduled > 0 && (
              <button onClick={() => onOpen('manage')} className="block text-blue-300 hover:underline text-left">
                🗓️ {stats.scheduled} article(s) scheduled
              </button>
            )}
            {stats.seo > 0 && (
              <button onClick={() => onOpen('seo')} className="block text-orange-300 hover:underline text-left">
                🔎 {stats.seo} article(s) have SEO problems
              </button>
            )}
          </div>
        </Card>
      )}

      {stats.categories.length > 0 && (
        <Card title="Articles per category">
          <div className="space-y-2">
            {stats.categories.map(([name, count]) => (
              <div key={name} className="text-xs">
                <div className="flex justify-between text-gray-300 mb-1">
                  <span className="truncate">{name}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(count / maxCategory) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Average live article: {stats.avgWords} words.</p>
        </Card>
      )}

      {loading && articles.length === 0 && <Loading text="Loading articles..." />}
      {articles.length > 0 && (
        <Card title="Latest articles">
          <div className="space-y-2">
            {articles.slice(0, 6).map((a) => (
              <div key={a.name} className="flex items-center gap-2 bg-gray-700/60 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-200 truncate flex-1">{a.title || a.name}</span>
                <StatusBadge status={a.status} />
                <button onClick={() => onEdit(a.name)} className="text-blue-400 text-xs hover:underline shrink-0">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK.map((item) => (
          <button
            key={item.tab}
            onClick={() => onOpen(item.tab)}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl transition text-left px-5"
          >
            <p className="text-base">
              {item.icon} {item.title}
            </p>
            <p className="text-gray-400 text-xs font-normal mt-1">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
