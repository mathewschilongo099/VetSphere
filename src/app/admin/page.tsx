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

  // HARD-CODED PASSWORD (FIX)
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

  // ================= ARTICLE STATE =================
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
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

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

          {message && (
            <p className="text-red-400 text-center mt-2">{message}</p>
          )}
        </form>
      </div>
    );
  }

  // ================= MAIN ADMIN =================
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">VetSphere Admin</h1>
        <p className="text-gray-400">System restored and stable</p>
      </div>
    </div>
  );
}
