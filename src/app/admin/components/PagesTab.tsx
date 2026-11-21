'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errMsg, getIn, post, setIn } from './api';
import { Card, Field, Loading, Msg, btnGhost, btnPrimary, inputCls } from './ui';

type PageId = 'about' | 'services' | 'site';

const PAGES: { id: PageId; label: string; file: string }[] = [
  { id: 'about', label: '👤 About Page', file: 'about' },
  { id: 'services', label: '🩺 Services Page', file: 'services' },
  { id: 'site', label: '🌐 Site Settings', file: 'settings' },
];

// A text box bound to a "a.b.c" path inside the page content.
function Txt({
  label,
  path,
  content,
  onChange,
  rows,
}: {
  label: string;
  path: string;
  content: any;
  onChange: (next: any) => void;
  rows?: number;
}) {
  const props = {
    value: getIn(content, path) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
      onChange(setIn(content, path, e.target.value)),
    className: inputCls,
  };
  return <Field label={label}>{rows ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}</Field>;
}

export default function PagesTab() {
  const [page, setPage] = useState<PageId>('about');
  const [content, setContent] = useState<any>(null);
  const [sha, setSha] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');

  const file = (id: PageId) => PAGES.find((p) => p.id === id)!.file;

  const load = useCallback(async (id: PageId) => {
    setLoading(true);
    setMessage('');
    setContent(null);
    setDirty(false);
    try {
      const data = await api<{ content?: any; sha?: string; error?: string }>(`/api/pages/${file(id)}`);
      if (data.error || !data.content) throw new Error(data.error || 'Failed to load page content.');
      setContent(data.content);
      setSha(data.sha || '');
    } catch (e) {
      setMessage(`❌ ${errMsg(e, 'Failed to load page content.')}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const update = (next: any) => {
    setContent(next);
    setDirty(true);
  };

  const switchTo = (id: PageId) => {
    if (id === page) return;
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
    setPage(id);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const data = await post<{ success?: boolean; error?: string }>(`/api/pages/${file(page)}`, { content, sha });
      if (data.success) {
        setMessage('✅ Page updated! The site is rebuilding...');
        await load(page);
        setMessage('✅ Page updated! The site is rebuilding...');
      } else {
        setMessage(`❌ ${data.error || 'Save failed'}`);
      }
    } catch (e) {
      setMessage(`❌ ${errMsg(e, 'Save failed. Try again.')}`);
    } finally {
      setSaving(false);
    }
  };

  // Services list helpers
  const services: any[] = content?.services || [];
  const patchService = (i: number, p: Record<string, string>) =>
    update({ ...content, services: services.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const moveService = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= services.length) return;
    const next = [...services];
    [next[i], next[j]] = [next[j], next[i]];
    update({ ...content, services: next });
  };
  const addService = () => update({ ...content, services: [...services, { icon: '🩺', title: '', desc: '' }] });
  const removeService = (i: number) => {
    if (!confirm('Remove this service?')) return;
    update({ ...content, services: services.filter((_, j) => j !== i) });
  };

  const T = (label: string, path: string, rows?: number) => (
    <Txt label={label} path={path} content={content} onChange={update} rows={rows} />
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => switchTo(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${page === p.id ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      <Msg text={message} />

      {!loading && content && (
        <div className="space-y-4">
          {page === 'about' && (
            <>
              <Card title="Hero section">
                {T('Page title', 'hero.title')}
                {T('Subtitle', 'hero.subtitle')}
              </Card>
              <Card title="Founder bio">
                {T('Name', 'founder.name')}
                {T('Role', 'founder.role')}
                {T('Bio', 'founder.bio', 4)}
              </Card>
              <Card title="Mission and vision">
                {T('Mission', 'mission', 3)}
                {T('Vision', 'vision', 3)}
              </Card>
            </>
          )}

          {page === 'services' && (
            <>
              <Card title="Hero section">
                {T('Title', 'hero.title')}
                {T('Subtitle', 'hero.subtitle')}
              </Card>
              <Card title={`Services (${services.length})`}>
                {services.map((service, i) => (
                  <div key={i} className="bg-gray-700 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={service.icon || ''}
                        onChange={(e) => patchService(i, { icon: e.target.value })}
                        placeholder="Icon"
                        className="w-16 px-2 py-1 rounded-lg bg-gray-600 text-white text-sm focus:outline-none"
                      />
                      <input
                        value={service.title || ''}
                        onChange={(e) => patchService(i, { title: e.target.value })}
                        placeholder="Title"
                        className="flex-1 px-3 py-1 rounded-lg bg-gray-600 text-white text-sm focus:outline-none"
                      />
                    </div>
                    <textarea
                      value={service.desc || ''}
                      onChange={(e) => patchService(i, { desc: e.target.value })}
                      rows={2}
                      placeholder="Description"
                      className="w-full px-3 py-1 rounded-lg bg-gray-600 text-white text-sm focus:outline-none"
                    />
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => moveService(i, -1)} disabled={i === 0} className="text-gray-300 disabled:opacity-30">
                        ↑ Up
                      </button>
                      <button
                        onClick={() => moveService(i, 1)}
                        disabled={i === services.length - 1}
                        className="text-gray-300 disabled:opacity-30"
                      >
                        ↓ Down
                      </button>
                      <button onClick={() => removeService(i)} className="text-red-400 ml-auto">
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={addService} className={`${btnGhost} px-4 py-2`}>
                  + Add a service
                </button>
              </Card>
            </>
          )}

          {page === 'site' && (
            <>
              <Card title="Site information">
                {T('Site name', 'site.name')}
                {T('Tagline', 'site.tagline')}
                {T('Description', 'site.description')}
                {T('Contact email', 'site.email')}
                {T('Site URL', 'site.url')}
              </Card>
              <Card title="Homepage text">
                {T('Hero title', 'homepage.hero_title')}
                {T('Hero highlight text', 'homepage.hero_highlight')}
                {T('Hero description', 'homepage.hero_description')}
              </Card>
              <Card title="Footer text">
                {T('Footer tagline', 'footer.tagline')}
                {T('Copyright text', 'footer.copyright')}
                {T('Credit text', 'footer.credit')}
              </Card>
            </>
          )}

          <button onClick={save} disabled={saving || !dirty} className={`${btnPrimary} w-full py-4`}>
            {saving ? '⏳ Saving...' : dirty ? '💾 Save changes' : 'No changes to save'}
          </button>
        </div>
      )}
    </div>
  );
}
