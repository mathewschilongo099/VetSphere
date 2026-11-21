'use client';

import type { ReactNode } from 'react';
import type { ArticleStatus } from '@/lib/frontmatter';

export const inputCls =
  'w-full px-4 py-2 rounded-xl bg-gray-700 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400';
export const btnPrimary =
  'bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl transition';
export const btnGhost =
  'bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-xl transition';

// A status line. The first characters decide the colour: success, warning,
// progress, or (anything else) error.
export function Msg({ text }: { text: string }) {
  if (!text) return null;
  const tone = text.startsWith('✅')
    ? 'bg-green-900/30 text-green-400'
    : text.startsWith('⚠️')
      ? 'bg-yellow-900/30 text-yellow-400'
      : text.startsWith('⏳')
        ? 'bg-gray-700 text-gray-300'
        : 'bg-red-900/30 text-red-400';
  return <p className={`text-center text-sm py-2 px-4 rounded-xl ${tone}`}>{text}</p>;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
      {title && <h3 className="text-sm font-bold text-gray-300">{title}</h3>}
      {children}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {children}
      {hint && <div className="text-xs mt-1 text-gray-500">{hint}</div>}
    </div>
  );
}

export function Loading({ text = 'Loading...' }: { text?: string }) {
  return <p className="text-center text-gray-400 py-8">⏳ {text}</p>;
}

const STATUS_STYLE: Record<ArticleStatus, string> = {
  published: 'bg-green-900/40 text-green-300',
  draft: 'bg-yellow-900/40 text-yellow-300',
  scheduled: 'bg-blue-900/40 text-blue-300',
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[status]}`}>{status}</span>
  );
}
