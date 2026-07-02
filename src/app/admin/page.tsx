'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  LogOut,
  Shield,
  Menu,
  Zap,
  Link2,
} from 'lucide-react';

interface ArticleFile {
  name: string;
  sha: string;
  selected: boolean;
}

export default function AdminPage() {
  // ================= AUTH =================
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [message, setMessage] = useState('');

  const ADMIN_PASSWORD = 'ChihAna21*';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Wrong password');
    }
  };

  // ================= CORE STATE =================
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState('');
  const [title, setTitle] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [sourceUrl, setSourceUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');

  const [articles, setArticles] = useState<ArticleFile[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'write' | 'manage'>('dashboard');

  // ================= LOAD ARTICLES =================
  const loadArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles((data.files || []).map((f: any) => ({ ...f, selected: false })));
    } catch {
      console.log('Failed to load articles');
    }
  };

  useEffect(() => {
    if (authenticated) loadArticles();
  }, [authenticated]);

  // ================= GENERATE =================
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);

    try {
      const res = await fetch(`/api/generate?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();

      setArticle(data.content || '');
      setTitle(data.title || topic);
      setHeroImage(data.heroImage || '');
      setExcerpt(data.excerpt || '');
      setMetaDescription(data.metaDescription || '');
      setTags(data.tags || []);
    } finally {
      setGenerating(false);
    }
  };

  // ================= URL GENERATE =================
  const handleGenerateFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;

    setUrlLoading(true);

    try {
      const res = await fetch('/api/rewrite-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl, topic }),
      });

      const data = await res.json();

      setArticle(data.content || '');
      setTitle(data.title || '');
      setHeroImage(data.heroImage || '');
      setSourceTitle(data.sourceTitle || '');
    } finally {
      setUrlLoading(false);
    }
  };

  // ================= PUBLISH =================
  const handlePublish = async () => {
    if (!article.trim()) return;

    setPublishing(true);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: article,
          excerpt,
          metaDescription,
          tags,
          heroImage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setArticle('');
        setTopic('');
        setTitle('');
        setHeroImage('');
        setExcerpt('');
        setMetaDescription('');
        setTags([]);
      }
    } finally {
      setPublishing(false);
    }
  };

  // ================= LOGIN SCREEN =================
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded-xl w-full max-w-sm">
          <Shield className="text-white mx-auto mb-4" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white"
            placeholder="Enter password"
          />
          <button className="w-full mt-4 bg-green-600 p-3 rounded text-white">
            Login
          </button>
          {message && <p className="text-red-400 text-center mt-2">{message}</p>}
        </form>
      </div>
    );
  }

  // ================= MAIN ADMIN UI =================
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">

      {/* SIDEBAR */}
      <div className="w-64 bg-gray-800 p-4 space-y-2">
        <h1 className="text-green-400 font-bold text-lg">VetSphere Admin</h1>

        <button onClick={() => setActiveTab('dashboard')} className="w-full text-left p-2 hover:bg-gray-700 rounded">
          Dashboard
        </button>

        <button onClick={() => setActiveTab('write')} className="w-full text-left p-2 hover:bg-gray-700 rounded">
          Write
        </button>

        <button onClick={() => setActiveTab('manage')} className="w-full text-left p-2 hover:bg-gray-700 rounded">
          Manage
        </button>

        <button
          onClick={() => setAuthenticated(false)}
          className="w-full text-left p-2 hover:bg-red-600 rounded mt-6"
        >
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-gray-400">Welcome back</p>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-800 p-4 rounded">Articles: {articles.length}</div>
              <div className="bg-gray-800 p-4 rounded">Status: Active</div>
              <div className="bg-gray-800 p-4 rounded">System OK</div>
            </div>
          </div>
        )}

        {/* WRITE */}
        {activeTab === 'write' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Write Article</h2>

            <form onSubmit={handleGenerate} className="space-y-3">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 bg-gray-800 rounded"
                placeholder="Enter topic"
              />

              <button className="bg-green-600 px-4 py-2 rounded">
                Generate
              </button>
            </form>

            {article && (
              <div className="mt-6 bg-gray-800 p-4 rounded">
                <h3 className="font-bold">{title}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{article}</p>

                <button
                  onClick={handlePublish}
                  className="mt-4 bg-blue-600 px-4 py-2 rounded"
                >
                  Publish
                </button>
              </div>
            )}
          </div>
        )}

        {/* MANAGE */}
        {activeTab === 'manage' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Manage Articles</h2>

            <button
              onClick={loadArticles}
              className="bg-gray-700 px-4 py-2 rounded mb-4"
            >
              Refresh
            </button>

            <div className="space-y-2">
              {articles.map((a, i) => (
                <div key={i} className="bg-gray-800 p-3 rounded flex justify-between">
                  <span>{a.name.replace('.md', '')}</span>
                  <Link href={`/articles/${a.name.replace('.md', '')}`} className="text-green-400">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
