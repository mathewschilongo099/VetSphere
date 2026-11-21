'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from './api';
import { Loading, Msg } from './ui';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export default function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api<{ news?: NewsItem[] }>('/api/news');
      setNews(data.news || []);
    } catch (e) {
      setNews([]);
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">📰 Veterinary news</h2>
        <button onClick={load} disabled={loading} className="text-green-400 text-sm hover:underline">
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>
      <Msg text={message} />
      {loading && <Loading text="Loading news..." />}
      {!loading && news.length === 0 && !message && <p className="text-center text-gray-400 py-8">No news found.</p>}
      <div className="space-y-3">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition"
          >
            <p className="text-white text-sm font-semibold leading-snug mb-1">{item.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {item.source && <span className="text-green-400">{item.source}</span>}
              {item.pubDate && <span>{new Date(item.pubDate).toLocaleDateString()}</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
