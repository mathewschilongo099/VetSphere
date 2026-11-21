'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  EMPTY_META,
  articleStatus,
  buildArticle,
  isAllowedImage,
  parseArticle,
  slugify,
  type ArticleMeta,
} from '@/lib/frontmatter';
import { api, errMsg, post, type AdminArticle } from './api';
import ArticleForm from './ArticleForm';
import { Loading, Msg, btnPrimary, inputCls } from './ui';

const DEFAULT_AUTHOR = 'Mathews Chilongo';
const DEFAULT_CATEGORY = 'Animal Health';
const FALLBACK_IMAGE = '/images/articles/cattle-diseases.jpg';
const today = () => new Date().toISOString().split('T')[0];

const PUBLISH_LABEL = {
  published: '🚀 Publish Article',
  draft: '💾 Save Draft',
  scheduled: '🗓️ Schedule Article',
} as const;

const PUBLISH_DONE = {
  published: '✅ Article published! The site is rebuilding...',
  draft: '✅ Draft saved. It stays hidden from the public site until you publish it.',
  scheduled: '✅ Article scheduled. It appears on the first site rebuild after its publish time.',
} as const;

export default function WriteTab({
  articles,
  editName,
  onClose,
  onChanged,
}: {
  articles: AdminArticle[];
  editName: string | null;
  onClose: (goToManage: boolean) => void;
  onChanged: () => Promise<void> | void;
}) {
  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).sort(),
    [articles]
  );

  // ── Generate a new article ──
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [meta, setMeta] = useState<ArticleMeta>(EMPTY_META);
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setMessage('');
    setGenerated(false);
    try {
      const data = await api<any>(`/api/generate?topic=${encodeURIComponent(topic)}`);
      if (data.error) {
        setMessage(`❌ ${data.error}`);
        return;
      }
      const title: string = data.title || topic;
      setMeta({
        ...EMPTY_META,
        title,
        description: data.metaDescription || '',
        date: today(),
        author: DEFAULT_AUTHOR,
        category: DEFAULT_CATEGORY,
        tags: data.tags?.length ? data.tags : ['animal health', 'veterinary'],
        image: data.heroImage || '',
        imageAlt: title,
      });
      setBody(data.content || '');
      setGenerated(true);
      setMessage('✅ Article generated! Review it, change the photo if you like, then publish.');
    } catch (err) {
      setMessage(`❌ ${errMsg(err, 'Failed to generate. Try again.')}`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!body.trim() || !meta.title.trim()) {
      setMessage('⚠️ The article needs a title and some text.');
      return;
    }
    if (!isAllowedImage(meta.image)) {
      setMessage('❌ The chosen photo address is not allowed on this site. Pick another photo.');
      return;
    }
    const slug = slugify(meta.title);
    if (!slug) {
      setMessage('⚠️ Please give the article a title using letters or numbers.');
      return;
    }
    setPublishing(true);
    setMessage('');
    try {
      const content = buildArticle(
        '',
        {
          ...meta,
          date: today(),
          image: meta.image || FALLBACK_IMAGE,
          imageAlt: meta.imageAlt || meta.title,
          tags: meta.tags.length ? meta.tags : ['animal health', 'veterinary'],
        },
        body
      );
      const data = await post<{ success?: boolean; error?: string }>('/api/articles/create', {
        filename: `${slug}.md`,
        content,
      });
      if (data.success) {
        setMessage(PUBLISH_DONE[articleStatus(meta)]);
        setGenerated(false);
        setTopic('');
        setBody('');
        setMeta(EMPTY_META);
        await onChanged();
      } else {
        setMessage(`❌ ${data.error || 'Publishing failed'}`);
      }
    } catch (err) {
      setMessage(`❌ ${errMsg(err, 'Publishing failed. Try again.')}`);
    } finally {
      setPublishing(false);
    }
  };

  // ── Edit an existing article ──
  const raw = useRef('');
  const [sha, setSha] = useState('');
  const [editMeta, setEditMeta] = useState<ArticleMeta>(EMPTY_META);
  const [editBody, setEditBody] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const loadEdit = async (
    name: string,
    quiet = false,
    isStale: () => boolean = () => false
  ) => {
    if (!quiet) {
      // Clear the previous article so a failed load can never be saved
      raw.current = '';
      setSha('');
      setEditMeta(EMPTY_META);
      setEditBody('');
      setLoadingEdit(true);
    }
    try {
      const slug = name.replace(/\.md$/, '');
      const data = await api<{ content?: string; sha?: string; error?: string }>(
        `/api/articles/${encodeURIComponent(slug)}`
      );
      if (isStale()) return; // a newer article was opened meanwhile
      if (data.error || !data.content) throw new Error(data.error || 'Could not load the article.');
      raw.current = data.content;
      setSha(data.sha || '');
      if (!quiet) {
        const parsed = parseArticle(data.content);
        setEditMeta(parsed.meta);
        setEditBody(parsed.body);
      }
    } catch (err) {
      if (!isStale()) setEditMessage(`❌ ${errMsg(err)}`);
    } finally {
      if (!isStale()) setLoadingEdit(false);
    }
  };

  useEffect(() => {
    if (!editName) return;
    let stale = false;
    setEditMessage('');
    loadEdit(editName, false, () => stale);
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editName]);

  const saveEdit = async () => {
    if (!editName) return;
    if (!raw.current || !sha) {
      setEditMessage('⚠️ This article did not load properly. Close it and open it again.');
      return;
    }
    if (!editMeta.title.trim() || !editBody.trim()) {
      setEditMessage('⚠️ The article needs a title and some text.');
      return;
    }
    if (!isAllowedImage(editMeta.image)) {
      setEditMessage('❌ The chosen photo address is not allowed on this site. Pick another photo.');
      return;
    }
    setSaving(true);
    setEditMessage('');
    try {
      const content = buildArticle(raw.current, editMeta, editBody);
      const data = await post<{ success?: boolean; error?: string }>('/api/articles/update', {
        filename: editName,
        content,
        sha,
      });
      if (data.success) {
        await loadEdit(editName, true); // pick up the new version number
        setEditMessage('✅ Saved! The site is rebuilding...');
        await onChanged();
      } else {
        setEditMessage(`❌ ${data.error || 'Update failed'}`);
      }
    } catch (err) {
      setEditMessage(`❌ ${errMsg(err, 'Update failed. Try again.')}`);
    } finally {
      setSaving(false);
    }
  };

  const patchNew = (p: Partial<ArticleMeta>) => setMeta((m) => ({ ...m, ...p }));
  const patchEdit = (p: Partial<ArticleMeta>) => setEditMeta((m) => ({ ...m, ...p }));
  const editing = Boolean(editName);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => editing && onClose(false)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!editing ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
        >
          ✍️ Generate New
        </button>
        {editing && (
          <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white truncate max-w-full">
            ✏️ Editing: {editName?.replace('.md', '').replace(/-/g, ' ').slice(0, 28)}
          </span>
        )}
      </div>

      {!editing && (
        <>
          <form onSubmit={handleGenerate} className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic e.g. Milk Fever in Dairy Cows"
              className={`${inputCls} flex-1 py-4 px-5`}
            />
            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className={`${btnPrimary} px-6 py-4 whitespace-nowrap`}
            >
              {generating ? '⏳' : 'Generate'}
            </button>
          </form>
          <Msg text={message} />
          {generated && (
            <>
              <ArticleForm meta={meta} body={body} onMeta={patchNew} onBody={setBody} categories={categories} />
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition"
              >
                {publishing ? '⏳ Saving...' : PUBLISH_LABEL[articleStatus(meta)]}
              </button>
            </>
          )}
        </>
      )}

      {editing && (
        <div className="space-y-4">
          <Msg text={editMessage} />
          {loadingEdit ? (
            <Loading text="Loading article..." />
          ) : (
            <>
              <ArticleForm
                meta={editMeta}
                body={editBody}
                onMeta={patchEdit}
                onBody={setEditBody}
                categories={categories}
              />
              <div className="flex gap-3">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition"
                >
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                {articleStatus(editMeta) === 'published' && editName && (
                  <a
                    href={`/articles/${editName.replace('.md', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-5 rounded-xl transition"
                  >
                    View
                  </a>
                )}
                <button
                  onClick={() => onClose(true)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-5 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
