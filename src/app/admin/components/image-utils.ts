'use client';

import { api } from './api';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // keeps requests under the hosting body limit

// Phone photos are often 5-10 MB. Shrinks large JPEG/PNG/WebP images to at most
// 1600 px on the long side so they upload quickly and load fast on the site.
export async function prepareImage(file: File): Promise<File> {
  const MAX_SIDE = 1600;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 800 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  const prepared = await prepareImage(file);
  if (prepared.size > MAX_UPLOAD_BYTES) {
    return { error: `${file.name} is too large (maximum 4 MB after resizing).` };
  }
  const form = new FormData();
  form.append('file', prepared);
  const data = await api<{ success?: boolean; url?: string; error?: string }>('/api/upload', {
    method: 'POST',
    body: form,
  });
  return data.success && data.url ? { url: data.url } : { error: data.error || 'Upload failed' };
}
