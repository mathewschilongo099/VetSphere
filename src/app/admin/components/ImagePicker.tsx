'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { isAllowedImage } from '@/lib/frontmatter';
import { api, errMsg, formatBytes } from './api';
import { uploadImage } from './image-utils';
import { Msg, inputCls, btnPrimary, btnGhost } from './ui';

interface MediaImage {
  name: string;
  sha: string;
  url: string;
  downloadUrl: string;
  size?: number;
}

interface StockPhoto {
  id: string;
  thumb: string;
  url: string;
  credit: string;
  source: string;
}

type Mode = 'library' | 'upload' | 'stock' | 'url';

const MODES: { id: Mode; label: string }[] = [
  { id: 'library', label: '🖼️ Library' },
  { id: 'upload', label: '📤 Upload' },
  { id: 'stock', label: '🔍 Stock photos' },
  { id: 'url', label: '🔗 Link' },
];

// A pop-up for choosing a photo: from the media library, a new upload, a stock
// photo search, or a pasted link.
export default function ImagePicker({
  title = 'Choose a photo',
  initialQuery = '',
  onPick,
  onClose,
}: {
  title?: string;
  initialQuery?: string;
  onPick: (url: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>('library');
  const [message, setMessage] = useState('');

  const [images, setImages] = useState<MediaImage[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [searching, setSearching] = useState(false);

  const [link, setLink] = useState('');

  useEffect(() => {
    if (mode !== 'library' || images.length > 0) return;
    setLoadingLibrary(true);
    api<{ images?: MediaImage[] }>('/api/media')
      .then((data) => setImages(data.images || []))
      .catch((e) => setMessage(`❌ ${errMsg(e)}`))
      .finally(() => setLoadingLibrary(false));
  }, [mode, images.length]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setMessage('');
    try {
      const data = await api<{ photos?: StockPhoto[]; error?: string }>(
        `/api/image-search?q=${encodeURIComponent(query.trim())}`
      );
      setPhotos(data.photos || []);
      if (data.error) setMessage(`❌ ${data.error}`);
      else if (!data.photos?.length) setMessage('⚠️ No photos found. Try different words.');
    } catch (e) {
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (mode === 'stock' && initialQuery && photos.length === 0) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setMessage('⏳ Resizing and uploading...');
    try {
      const result = await uploadImage(file);
      if (result.url) onPick(result.url);
      else setMessage(`❌ ${result.error}`);
    } catch (err) {
      setMessage(`❌ ${errMsg(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const useLink = () => {
    const value = link.trim();
    if (!value) return setMessage('⚠️ Paste an image address first.');
    if (!isAllowedImage(value)) {
      return setMessage(
        '❌ This site only shows its own uploads and images from Unsplash or Pexels. Upload the photo instead.'
      );
    }
    onPick(value);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
            ✕ Close
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setMessage('');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${mode === m.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Msg text={message} />

        {mode === 'library' && (
          <>
            {loadingLibrary && <p className="text-center text-gray-400 py-6">⏳ Loading...</p>}
            {!loadingLibrary && images.length === 0 && (
              <p className="text-center text-gray-400 py-6">No uploaded photos yet. Use Upload.</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <button
                  key={img.sha}
                  onClick={() => onPick(img.url)}
                  className="bg-gray-800 rounded-xl overflow-hidden text-left hover:ring-2 hover:ring-green-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.downloadUrl} alt={img.name} loading="lazy" className="w-full h-24 object-cover" />
                  <p className="text-[10px] text-gray-400 truncate px-2 py-1">
                    {img.name} {formatBytes(img.size)}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'upload' && (
          <label
            className={`flex items-center justify-center px-4 py-10 rounded-xl border-2 border-dashed cursor-pointer transition ${uploading ? 'border-gray-600 text-gray-500' : 'border-green-600 text-green-400 hover:bg-green-900/20'}`}
          >
            <span>{uploading ? '⏳ Uploading...' : '📁 Choose a photo from your device'}</span>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        )}

        {mode === 'stock' && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
              className="flex gap-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. dairy cow, goat, veterinarian"
                className={inputCls}
              />
              <button type="submit" disabled={searching || !query.trim()} className={`${btnPrimary} px-4`}>
                {searching ? '⏳' : 'Search'}
              </button>
            </form>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => onPick(photo.url)}
                  className="bg-gray-800 rounded-xl overflow-hidden text-left hover:ring-2 hover:ring-green-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.thumb} alt={`Photo by ${photo.credit}`} loading="lazy" className="w-full h-24 object-cover" />
                  <p className="text-[10px] text-gray-400 truncate px-2 py-1">
                    {photo.credit} · {photo.source}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'url' && (
          <div className="space-y-3">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://images.pexels.com/... or /images/uploads/..."
              className={inputCls}
            />
            <button onClick={useLink} className={`${btnGhost} px-4 py-2`}>
              Use this image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
