'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, errMsg } from './api';
import { Loading, Msg, inputCls } from './ui';

interface LogItem {
  message: string;
  date: string;
  sha: string;
  url: string;
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api<{ logs?: LogItem[] }>('/api/logs');
      setLogs(data.logs || []);
    } catch (e) {
      setLogs([]);
      setMessage(`❌ ${errMsg(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? logs.filter((l) => l.message.toLowerCase().includes(q)) : logs;
  }, [logs, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">📋 Activity log</h2>
        <button onClick={load} disabled={loading} className="text-green-400 text-sm hover:underline">
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>
      <p className="text-xs text-gray-400">Every admin change is a commit, so this shows who changed what and when.</p>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Filter activity..." className={inputCls} />
      <Msg text={message} />
      {loading && <Loading text="Loading logs..." />}
      {!loading && shown.length === 0 && !message && <p className="text-center text-gray-400 py-8">No activity found.</p>}
      <div className="space-y-2">
        {shown.map((log, i) => (
          <a
            key={`${log.sha}-${i}`}
            href={log.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-white text-sm leading-snug flex-1">{log.message}</p>
              <span className="text-green-400 text-xs font-mono shrink-0">{log.sha}</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">{log.date ? new Date(log.date).toLocaleString() : ''}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
