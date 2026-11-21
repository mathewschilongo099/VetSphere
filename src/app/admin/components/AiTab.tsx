'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errMsg, getIn, post, setIn } from './api';
import { Card, Field, Loading, Msg, btnPrimary, inputCls } from './ui';

export default function AiTab() {
  const [settings, setSettings] = useState<any>(null);
  const [sha, setSha] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [newTopic, setNewTopic] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api<{ content?: any; sha?: string; error?: string }>('/api/pages/settings');
      if (data.error || !data.content) throw new Error(data.error || 'Failed to load AI settings.');
      setSettings(data.content);
      setSha(data.sha || '');
      setDirty(false);
    } catch (e) {
      setMessage(`❌ ${errMsg(e, 'Failed to load AI settings.')}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (path: string, value: unknown) => {
    setSettings((prev: any) => setIn(prev, path, value));
    setDirty(true);
  };

  const topics: string[] = getIn(settings, 'autopublish.topics') || [];

  const addTopic = () => {
    const t = newTopic.trim();
    if (!t) return;
    if (topics.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setMessage('⚠️ That topic is already in the list.');
      return;
    }
    set('autopublish.topics', [...topics, t]);
    setNewTopic('');
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const data = await post<{ success?: boolean; error?: string }>('/api/pages/settings', { content: settings, sha });
      if (data.success) {
        await load();
        setMessage('✅ AI settings saved! The site is rebuilding...');
      } else {
        setMessage(`❌ ${data.error || 'Save failed'}`);
      }
    } catch (e) {
      setMessage(`❌ ${errMsg(e, 'Save failed. Try again.')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">🤖 AI settings</h2>
      {loading && <Loading />}
      <Msg text={message} />

      {!loading && settings && (
        <div className="space-y-4">
          <Card title="💬 VetAssist chatbot">
            <Field label="Greeting message">
              <textarea
                value={getIn(settings, 'chatbot.greeting') || ''}
                onChange={(e) => set('chatbot.greeting', e.target.value)}
                rows={3}
                className={inputCls}
              />
            </Field>
            <Field label="System prompt (AI instructions)">
              <textarea
                value={getIn(settings, 'chatbot.system_prompt') || ''}
                onChange={(e) => set('chatbot.system_prompt', e.target.value)}
                rows={6}
                className={`${inputCls} font-mono`}
              />
            </Field>
          </Card>

          <Card title={`📋 Auto-publish topic list (${topics.length})`}>
            <p className="text-xs text-gray-400">These topics are used when no trending topic is found.</p>
            <div className="flex gap-2">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                placeholder="Add new topic..."
                className={inputCls}
              />
              <button
                onClick={addTopic}
                disabled={!newTopic.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold px-4 rounded-xl transition"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topics.map((topic, i) => (
                <div key={`${topic}-${i}`} className="flex items-center justify-between bg-gray-700 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-200">{topic}</span>
                  <button
                    onClick={() =>
                      set(
                        'autopublish.topics',
                        topics.filter((_, j) => j !== i)
                      )
                    }
                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <button onClick={save} disabled={saving || !dirty} className={`${btnPrimary} w-full py-4`}>
            {saving ? '⏳ Saving...' : dirty ? '💾 Save AI settings' : 'No changes to save'}
          </button>
        </div>
      )}
    </div>
  );
}
