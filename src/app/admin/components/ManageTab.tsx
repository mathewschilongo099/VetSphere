'use client';

import { useMemo, useState } from 'react';
import type { ArticleStatus } from '@/lib/frontmatter';
import { errMsg, post, type AdminArticle } from './api';
import { Loading, Msg, StatusBadge, btnGhost, inputCls } from './ui';

const PER_PAGE = 20;
type Sort = 'newest' | 'oldest' | 'title' | 'words';

export default function ManageTab({
  articles,
  loading,
  error,
  onReload,
  onEdit,
  onChanged,
}: {
  articles: AdminArticle[];
  loading: boolean;
  error: string;
  onReload: () => void;
  onEdit: (name: string) => void;
  onChanged: () => Promise<void> | void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ArticleStatus>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [catValue, setCatValue] = useState('');
  const [tagValue, setTagValue] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).sort(),
    [articles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = articles.filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        (category === 'all' || a.category === category) &&
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)))
    );
    const sorted = [...list]; // the server already sends newest first
    if (sort === 'oldest') sorted.sort((a, b) => (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0));
    if (sort === 'title') sorted.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    if (sort === 'words') sorted.sort((a, b) => b.words - a.words);
    return sorted;
  }, [articles, search, status, category, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // Only keep selections that still exist (after a delete or a refresh).
  const names = useMemo(() => articles.filter((a) => selected.has(a.name)).map((a) => a.name), [articles, selected]);

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const run = async (label: string, body: Record<string, unknown>) => {
    if (names.length === 0) return;
    setBusy(true);
    setMessage('');
    try {
      const data = await post<{ success?: boolean; changed?: number; error?: string }>('/api/articles/bulk', {
        ...body,
        names,
      });
      if (data.success) {
        setMessage(
          data.changed
            ? `✅ ${label}: ${data.changed} article${data.changed === 1 ? '' : 's'}. The site is rebuilding...`
            : '⚠️ Nothing needed changing.'
        );
        setSelected(new Set());
        setCatValue('');
        setTagValue('');
        await onChanged();
      } else {
        setMessage(`❌ ${data.error || 'Update failed'}`);
      }
    } catch (e) {
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (names.length === 0) return;
    if (!confirm(`Delete ${names.length} article(s)? This cannot be undone.`)) return;
    setBusy(true);
    setMessage('');
    try {
      const data = await post<{ success?: boolean; deleted?: number; error?: string }>('/api/delete-articles', {
        files: names.map((name) => ({ name })),
      });
      if (data.success) {
        setMessage(`✅ Deleted ${data.deleted} article(s). The site is rebuilding...`);
        setSelected(new Set());
        await onChanged();
      } else {
        setMessage(`❌ ${data.error || 'Delete failed. Try again.'}`);
      }
    } catch (e) {
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Articles ({filtered.length}
          {filtered.length !== articles.length ? ` of ${articles.length}` : ''})
        </h2>
        <button onClick={onReload} disabled={loading} className="text-green-400 text-sm hover:underline">
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="🔍 Search title, file name or tag..."
        className={`${inputCls} py-3`}
      />

      <div className="grid grid-cols-3 gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | ArticleStatus);
            setPage(1);
          }}
          className={inputCls}
        >
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className={inputCls}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={inputCls}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title A-Z</option>
          <option value="words">Longest</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelected(new Set(filtered.map((a) => a.name)))}
          disabled={filtered.length === 0}
          className={`${btnGhost} px-4 py-2`}
        >
          Select all ({filtered.length})
        </button>
        <button onClick={() => setSelected(new Set())} disabled={names.length === 0} className={`${btnGhost} px-4 py-2`}>
          Clear
        </button>
      </div>

      {names.length > 0 && (
        <div className="bg-gray-800 border border-green-700 rounded-2xl p-3 space-y-3">
          <p className="text-sm font-semibold">{names.length} selected</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => run('Published', { action: 'publish_now' })} className={`${btnGhost} px-3 py-2`}>
              🚀 Publish
            </button>
            <button disabled={busy} onClick={() => run('Moved to drafts', { action: 'draft' })} className={`${btnGhost} px-3 py-2`}>
              📝 Make draft
            </button>
            <button disabled={busy} onClick={() => run('Featured', { action: 'feature', value: true })} className={`${btnGhost} px-3 py-2`}>
              ⭐ Feature
            </button>
            <button disabled={busy} onClick={() => run('Unfeatured', { action: 'feature', value: false })} className={`${btnGhost} px-3 py-2`}>
              Unfeature
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={catValue}
              onChange={(e) => setCatValue(e.target.value)}
              list="manage-categories"
              placeholder="Set category..."
              className={inputCls}
            />
            <datalist id="manage-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <button
              disabled={busy || !catValue.trim()}
              onClick={() => run('Category changed', { action: 'category', value: catValue.trim() })}
              className={`${btnGhost} px-4`}
            >
              Apply
            </button>
          </div>
          <div className="flex gap-2">
            <input value={tagValue} onChange={(e) => setTagValue(e.target.value)} placeholder="Add a tag..." className={inputCls} />
            <button
              disabled={busy || !tagValue.trim()}
              onClick={() => run('Tag added', { action: 'add_tag', value: tagValue.trim() })}
              className={`${btnGhost} px-4`}
            >
              Add
            </button>
          </div>
          <button
            disabled={busy}
            onClick={remove}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl transition"
          >
            {busy ? '⏳ Working...' : `🗑️ Delete ${names.length}`}
          </button>
        </div>
      )}

      {error && <Msg text={`❌ ${error}`} />}
      <Msg text={message} />
      {loading && articles.length === 0 && <Loading text="Loading articles..." />}
      {!loading && filtered.length === 0 && <p className="text-center text-gray-400 py-8">No articles found.</p>}

      <div className="space-y-2">
        {visible.map((a) => {
          const on = selected.has(a.name);
          return (
            <div
              key={a.name}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${on ? 'bg-green-900/30 border border-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <button
                onClick={() => toggle(a.name)}
                aria-label="Select article"
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${on ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}
              >
                {on && <span className="text-white text-xs font-bold">✓</span>}
              </button>
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image} alt="" loading="lazy" className="w-12 h-12 object-cover rounded-lg bg-gray-700 shrink-0" />
              )}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(a.name)}>
                <p className="text-sm text-gray-100 truncate">{a.title || a.name}</p>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <StatusBadge status={a.status} />
                  {a.featured && <span className="text-xs text-purple-300">⭐ Featured</span>}
                  {a.category && <span className="text-xs text-gray-400">{a.category}</span>}
                  <span className="text-xs text-gray-500">{a.date.slice(0, 10)}</span>
                  <span className="text-xs text-gray-500">{a.words} words</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button onClick={() => onEdit(a.name)} className="text-blue-400 text-xs hover:underline">
                  ✏️ Edit
                </button>
                {a.status === 'published' && (
                  <a
                    href={`/articles/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 text-xs hover:underline"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1} className={`${btnGhost} px-4 py-2`}>
            ← Prev
          </button>
          <span className="text-sm text-gray-400">
            Page {current} of {pages}
          </span>
          <button onClick={() => setPage(Math.min(pages, current + 1))} disabled={current === pages} className={`${btnGhost} px-4 py-2`}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
