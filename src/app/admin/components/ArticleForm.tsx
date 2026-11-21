'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { articleStatus, isAllowedImage, wordCount, type ArticleMeta, type ArticleStatus } from '@/lib/frontmatter';
import ImagePicker from './ImagePicker';
import { Field, inputCls, btnGhost } from './ui';

const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const defaultSchedule = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
};

const STATUSES: { id: ArticleStatus; label: string }[] = [
  { id: 'published', label: '🚀 Published' },
  { id: 'draft', label: '📝 Draft' },
  { id: 'scheduled', label: '🗓️ Scheduled' },
];

// The editing form used both for a newly generated article and for editing an
// existing one: details, photo, status and the article text.
export default function ArticleForm({
  meta,
  body,
  onMeta,
  onBody,
  categories,
}: {
  meta: ArticleMeta;
  body: string;
  onMeta: (patch: Partial<ArticleMeta>) => void;
  onBody: (body: string) => void;
  categories: string[];
}) {
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [preview, setPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imageBroken, setImageBroken] = useState(false);

  const status = articleStatus(meta);
  const descLen = meta.description.length;

  const setStatus = (next: ArticleStatus) => {
    if (next === 'published') onMeta({ draft: false, publishDate: '' });
    else if (next === 'draft') onMeta({ draft: true, publishDate: '' });
    else {
      const keep = meta.publishDate && Date.parse(meta.publishDate) > Date.now();
      onMeta({ draft: false, publishDate: keep ? meta.publishDate : defaultSchedule() });
    }
  };

  const addTags = (raw: string) => {
    const added = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !meta.tags.some((x) => x.toLowerCase() === t.toLowerCase()));
    if (added.length) onMeta({ tags: [...meta.tags, ...added] });
    setTagInput('');
  };

  return (
    <div className="space-y-4">
      <Field label="Title">
        <input
          value={meta.title}
          onChange={(e) => onMeta({ title: e.target.value })}
          className={`${inputCls} font-bold text-base`}
        />
      </Field>

      <Field
        label="Meta description (shown in Google results)"
        hint={
          <span className={descLen > 160 || (descLen > 0 && descLen < 70) ? 'text-yellow-400' : ''}>
            {descLen} characters (aim for 70 to 160)
          </span>
        }
      >
        <textarea
          value={meta.description}
          onChange={(e) => onMeta({ description: e.target.value })}
          rows={2}
          className={inputCls}
        />
      </Field>

      {/* Photo */}
      <div className="bg-gray-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">Article photo</p>
          <div className="flex gap-2">
            <button onClick={() => setPickingPhoto(true)} className={`${btnGhost} px-3 py-1.5`}>
              📷 {meta.image ? 'Change photo' : 'Add photo'}
            </button>
            {meta.image && (
              <button
                onClick={() => onMeta({ image: '' })}
                className="text-red-400 hover:text-red-300 text-xs px-2"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {meta.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meta.image}
              alt={meta.imageAlt || meta.title}
              onError={() => setImageBroken(true)}
              onLoad={() => setImageBroken(false)}
              className="w-full h-44 object-cover rounded-xl bg-gray-700"
            />
            {imageBroken && (
              <p className="text-xs text-yellow-400">
                The preview could not load. A photo you just uploaded appears after the site finishes rebuilding
                (about a minute).
              </p>
            )}
            {!isAllowedImage(meta.image) && (
              <p className="text-xs text-red-400">
                This address is not allowed by the site (only its own uploads, Unsplash and Pexels). Choose another
                photo.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500">No photo yet. The site shows a placeholder.</p>
        )}
        <Field label="Photo description (alt text, helps accessibility and SEO)">
          <input
            value={meta.imageAlt}
            onChange={(e) => onMeta({ imageAlt: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Category">
          <input
            value={meta.category}
            onChange={(e) => onMeta({ category: e.target.value })}
            list="admin-categories"
            className={inputCls}
          />
          <datalist id="admin-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Author">
          <input value={meta.author} onChange={(e) => onMeta({ author: e.target.value })} className={inputCls} />
        </Field>
      </div>

      <Field label="Tags (press Enter or comma to add)">
        <div className="flex flex-wrap gap-2 mb-2">
          {meta.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onMeta({ tags: meta.tags.filter((t) => t !== tag) })}
              className="bg-green-800 text-green-200 text-xs px-3 py-1 rounded-full hover:bg-red-800"
              title="Tap to remove"
            >
              {tag} ✕
            </button>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={(e) => {
            if (e.target.value.includes(',')) addTags(e.target.value);
            else setTagInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTags(tagInput);
            }
          }}
          onBlur={() => tagInput && addTags(tagInput)}
          placeholder="Add a tag..."
          className={inputCls}
        />
      </Field>

      {/* Status */}
      <div className="bg-gray-800 rounded-xl p-3 space-y-3">
        <p className="text-sm font-semibold text-gray-300">Visibility</p>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${status === s.id ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {status === 'scheduled' && (
          <Field
            label="Publish on"
            hint="The article appears on the first site rebuild after this time (the auto-publisher rebuilds the site three times a day)."
          >
            <input
              type="datetime-local"
              value={toLocalInput(meta.publishDate)}
              onChange={(e) =>
                onMeta({ publishDate: e.target.value ? new Date(e.target.value).toISOString() : '' })
              }
              className={inputCls}
            />
          </Field>
        )}
        {status === 'draft' && <p className="text-xs text-gray-500">Drafts are saved but hidden from the public site.</p>}
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.featured}
            onChange={(e) => onMeta({ featured: e.target.checked })}
            className="w-4 h-4 accent-green-500"
          />
          ⭐ Featured on the homepage
        </label>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setPreview(false)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!preview ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setPreview(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${preview ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              👁️ Preview
            </button>
          </div>
          <span className="text-xs text-gray-500">{wordCount(body)} words</span>
        </div>
        {!preview ? (
          <textarea
            value={body}
            onChange={(e) => onBody(e.target.value)}
            rows={22}
            className="w-full px-5 py-4 rounded-xl bg-gray-800 text-gray-200 text-sm leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        ) : (
          <div className="bg-white text-gray-900 rounded-xl p-5 min-h-64 overflow-auto prose prose-sm max-w-none">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        )}
      </div>

      {pickingPhoto && (
        <ImagePicker
          title="Choose the article photo"
          initialQuery={meta.title}
          onClose={() => setPickingPhoto(false)}
          onPick={(url) => {
            onMeta({ image: url });
            setImageBroken(false);
            setPickingPhoto(false);
          }}
        />
      )}
    </div>
  );
}
