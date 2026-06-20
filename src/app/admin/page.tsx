'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState('');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'vetsphere2024') {
      setAuthenticated(true);
    } else {
      setMessage('Wrong password');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setMessage('');
    setArticle('');

    try {
      const res = await fetch(`/api/generate?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      setArticle(data.content || '');
      setTitle(data.title || topic);
      setMessage('Article generated! Review it below then publish.');
    } catch {
      setMessage('Failed to generate. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!article.trim()) return;
    setPublishing(true);
    setMessage('');

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: article }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Article published successfully!');
        setArticle('');
        setTopic('');
        setTitle('');
      } else {
        setMessage('Publishing failed. Try again.');
      }
    } catch {
      setMessage('Publishing failed. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-white text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition"
            >
              Login
            </button>
            {message && <p className="text-red-400 text-center text-sm">{message}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">VetSphere Admin</h1>

        <form onSubmit={handleGenerate} className="flex gap-3 mb-6">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter article topic e.g. Foot and Mouth Disease in Cattle"
            className="flex-1 px-5 py-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            disabled={generating || !topic.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl transition"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {message && (
          <p className={`text-center text-sm mb-4 ${message.includes('success') ? 'text-green-400' : 'text-yellow-400'}`}>
            {message}
          </p>
        )}

        {article && (
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-gray-800 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <textarea
              value={article}
              onChange={(e) => setArticle(e.target.value)}
              rows={20}
              className="w-full px-5 py-4 rounded-xl bg-gray-800 text-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition"
            >
              {publishing ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
