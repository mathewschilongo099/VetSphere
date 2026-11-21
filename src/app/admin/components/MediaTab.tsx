'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { api, errMsg, formatBytes, post, type AdminArticle } from './api';
import ImagePicker from './ImagePicker';
import { uploadImage } from './image-utils';
import { Loading, Msg, inputCls } from './ui';

interface MediaImage {
  name: string;
  sha: string;
  url: string;
  downloadUrl: string;
  size?: number;
}

export default function MediaTab({
  articles,
  onChanged,
}: {
  articles: AdminArticle[];
  onChanged: () => Promise<void> | void;
}) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState('');
  const [swapping, setSwapping] = useState<MediaImage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ images?: MediaImage[] }>('/api/media');
      setImages(data.images || []);
    } catch (e) {
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // How many articles use each uploaded image as their main photo.
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of articles) if (a.image) map.set(a.image, (map.get(a.image) || 0) + 1);
    return map;
  }, [articles]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    let ok = 0;
    const failed: string[] = [];
    for (const [i, file] of files.entries()) {
      setMessage(`⏳ Uploading ${i + 1} of ${files.length}...`);
      try {
        const result = await uploadImage(file);
        if (result.url) ok += 1;
        else failed.push(result.error || file.name);
      } catch (err) {
        failed.push(errMsg(err));
      }
    }
    setUploading(false);
    setMessage(
      failed.length === 0
        ? `✅ Uploaded ${ok} photo${ok === 1 ? '' : 's'}. New photos appear on the live site after the rebuild (about a minute).`
        : `${ok ? '⚠️' : '❌'} Uploaded ${ok}, failed ${failed.length}: ${failed.join(' · ')}`
    );
    await load();
  };

  const remove = async (img: MediaImage) => {
    const used = usage.get(img.url) || 0;
    const warning = used
      ? `"${img.name}" is the photo of ${used} article(s). They will show a broken photo until you choose another. Delete anyway?`
      : `Delete "${img.name}"? This cannot be undone.`;
    if (!confirm(warning)) return;
    setBusy(img.name);
    setMessage('');
    try {
      const data = await api<{ success?: boolean; error?: string }>('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: img.name }),
      });
      if (data.success) {
        setMessage('✅ Photo deleted.');
        await load();
      } else {
        setMessage(`❌ ${data.error || 'Delete failed'}`);
      }
    } catch (e) {
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setBusy('');
    }
  };

  const swap = async (img: MediaImage, to: string) => {
    setSwapping(null);
    if (to === img.url) return;
    setBusy(img.name);
    setMessage('');
    try {
      const data = await post<{ success?: boolean; changed?: number; error?: string }>('/api/articles/bulk', {
        action: 'replace_image',
        from: img.url,
        to,
      });
      if (data.success) {
        setMessage(`✅ Replaced the photo on ${data.changed || 0} article(s). The site is rebuilding...`);
        await onChanged();
      } else {
        setMessage(`❌ ${data.error || 'Could not replace the photo'}`);
      }
    } catch (e) {
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setBusy('');
    }
  };

  const q = search.trim().toLowerCase();
  const shown = q ? images.filter((i) => i.name.toLowerCase().includes(q)) : images;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">🖼️ Media library ({images.length})</h2>
        <button onClick={load} disabled={loading} className="text-green-400 text-sm hover:underline">
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        <label
          className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed cursor-pointer transition ${uploading ? 'border-gray-600 text-gray-500' : 'border-green-600 text-green-400 hover:bg-green-900/20'}`}
        >
          <span>{uploading ? '⏳ Uploading...' : '📁 Choose photos (you can pick several)'}</span>
          <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
        <p className="text-xs text-gray-500 mt-2">Large photos are resized automatically before uploading.</p>
      </div>

      <Msg text={message} />
      {images.length > 6 && (
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search photos..." className={inputCls} />
      )}
      {loading && images.length === 0 && <Loading text="Loading photos..." />}
      {!loading && shown.length === 0 && <p className="text-center text-gray-400 py-8">No photos found.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {shown.map((img) => {
          const used = usage.get(img.url) || 0;
          return (
            <div key={img.sha} className="bg-gray-800 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.downloadUrl} alt={img.name} loading="lazy" className="w-full h-32 object-cover" />
              <div className="p-2 space-y-1">
                <p className="text-xs text-gray-300 truncate">{img.name}</p>
                <p className="text-[11px] text-gray-500">
                  {formatBytes(img.size)}
                  {' · '}
                  <span className={used ? 'text-green-400' : ''}>{used ? `Used in ${used}` : 'Not used'}</span>
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(img.url);
                      setCopied(img.url);
                      setTimeout(() => setCopied(''), 2000);
                    }}
                    className="text-xs text-green-400 hover:underline"
                  >
                    {copied === img.url ? '✅ Copied' : '📋 Copy URL'}
                  </button>
                  {used > 0 && (
                    <button disabled={busy === img.name} onClick={() => setSwapping(img)} className="text-xs text-blue-400 hover:underline">
                      🔁 Swap
                    </button>
                  )}
                  <button disabled={busy === img.name} onClick={() => remove(img)} className="text-xs text-red-400 hover:underline">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {swapping && (
        <ImagePicker
          title={`Replace this photo on ${usage.get(swapping.url) || 0} article(s)`}
          onClose={() => setSwapping(null)}
          onPick={(url) => swap(swapping, url)}
        />
      )}
    </div>
  );
}
