'use client';

import { useMemo, useState } from 'react';
import { errMsg, post, type AdminArticle } from './api';
import { Card, Msg, btnGhost, inputCls } from './ui';

interface Entry {
  name: string;
  count: number;
  spellings: number;
}

type Kind = 'category' | 'tag';

// Counts values case-insensitively, so "Cattle" and "cattle" show as one entry.
function tally(lists: string[][]): Entry[] {
  const map = new Map<string, { name: string; count: number; spellings: Set<string> }>();
  for (const list of lists) {
    const seen = new Set<string>();
    for (const raw of list) {
      const value = raw.trim();
      const key = value.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = map.get(key) ?? { name: value, count: 0, spellings: new Set<string>() };
      entry.count += 1;
      entry.spellings.add(value);
      map.set(key, entry);
    }
  }
  return Array.from(map.values())
    .map((e) => ({ name: e.name, count: e.count, spellings: e.spellings.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export default function TaxonomyTab({
  articles,
  onChanged,
}: {
  articles: AdminArticle[];
  onChanged: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');

  const categories = useMemo(() => tally(articles.map((a) => [a.category])), [articles]);
  const tags = useMemo(() => tally(articles.map((a) => a.tags)), [articles]);

  const apply = async (label: string, body: Record<string, unknown>) => {
    setBusy(true);
    setMessage('');
    try {
      const data = await post<{ success?: boolean; changed?: number; error?: string }>('/api/articles/bulk', body);
      if (data.success) {
        setMessage(
          data.changed
            ? `✅ ${label}: ${data.changed} article${data.changed === 1 ? '' : 's'} updated. The site is rebuilding...`
            : '⚠️ Nothing needed changing.'
        );
        setEditing(null);
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

  const rename = (kind: Kind, entry: Entry) => {
    const target = value.trim();
    if (!target || target === entry.name) {
      setEditing(null);
      return;
    }
    if (!confirm(`Change ${kind} "${entry.name}" to "${target}" on ${entry.count} article(s)?`)) return;
    apply(kind === 'tag' ? 'Tag renamed' : 'Category renamed', {
      action: kind === 'tag' ? 'rename_tag' : 'rename_category',
      from: entry.name,
      to: target,
    });
  };

  const removeTag = (entry: Entry) => {
    if (!confirm(`Remove the tag "${entry.name}" from ${entry.count} article(s)?`)) return;
    apply('Tag removed', { action: 'remove_tag', value: entry.name });
  };

  const q = filter.trim().toLowerCase();
  const shownTags = q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags;

  const row = (kind: Kind, entry: Entry) => {
    const id = `${kind}:${entry.name}`;
    const open = editing === id;
    return (
      <div key={id} className="bg-gray-700/60 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-100 truncate flex-1">{entry.name}</span>
          {entry.spellings > 1 && <span className="text-[10px] text-yellow-400">{entry.spellings} spellings</span>}
          <span className="text-xs text-gray-400 shrink-0">{entry.count}</span>
          <button
            onClick={() => {
              setEditing(open ? null : id);
              setValue(entry.name);
            }}
            className="text-blue-400 text-xs hover:underline shrink-0"
          >
            Rename / merge
          </button>
          {kind === 'tag' && (
            <button disabled={busy} onClick={() => removeTag(entry)} className="text-red-400 text-xs hover:underline shrink-0">
              Remove
            </button>
          )}
        </div>
        {open && (
          <div className="flex gap-2 mt-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && rename(kind, entry)}
              className={inputCls}
              autoFocus
            />
            <button disabled={busy} onClick={() => rename(kind, entry)} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold px-4 rounded-xl">
              Save
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">🏷️ Categories and tags</h2>
      <p className="text-xs text-gray-400">
        Renaming changes every article that uses the name in one step. Renaming to a name that already exists merges the
        two. A new category appears when you type it in an article.
      </p>
      <Msg text={message} />

      <Card title={`Categories (${categories.length})`}>
        {categories.length === 0 && <p className="text-sm text-gray-500">No categories yet.</p>}
        <div className="space-y-2">{categories.map((c) => row('category', c))}</div>
      </Card>

      <Card title={`Tags (${tags.length})`}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search tags..." className={inputCls} />
        {shownTags.length === 0 && <p className="text-sm text-gray-500">No tags found.</p>}
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">{shownTags.map((t) => row('tag', t))}</div>
        <button onClick={() => setFilter('')} className={`${btnGhost} px-3 py-1.5`} hidden={!filter}>
          Clear search
        </button>
      </Card>
    </div>
  );
}
