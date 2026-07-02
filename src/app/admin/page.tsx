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
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState('');
  const [title, setTitle] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');

  const [sourceUrl, setSourceUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');

  const [showManager, setShowManager] = useState(false);
  const [articles, setArticles] = useState<ArticleFile[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingArticle, setProcessingArticle] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // ✅ UPDATED LOGIN (your requested change)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
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
    setHeroImage('');
    setExcerpt('');
    setMetaDescription('');
    setTags([]);

    try {
      const res = await fetch(`/api/generate?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      setArticle(data.content || '');
      setTitle(data.title || topic);
      setHeroImage(data.heroImage || '');
      setExcerpt(data.excerpt || '');
      setMetaDescription(data.metaDescription || '');
      setTags(data.tags || []);
      setMessage('✅ Article generated! Review it below then publish.');
    } catch {
      setMessage('❌ Failed to generate. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;

    setUrlLoading(true);
    setMessage('');
    setArticle('');
    setHeroImage('');
    setExcerpt('');
    setMetaDescription('');
    setTags([]);

    try {
      const res = await fetch('/api/rewrite-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sourceUrl,
          topic: topic || 'veterinary article'
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessage(`❌ ${data.error}`);
      } else {
        setArticle(data.content || '');
        setTitle(data.title || data.sourceTitle || '');
        setHeroImage(data.heroImage || '');
        setSourceTitle(data.sourceTitle || '');
        setMessage('✅ Article generated from URL! Review and edit below.');
      }
    } catch {
      setMessage('❌ Failed to generate from URL. Try again.');
    } finally {
      setUrlLoading(false);
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
        body: JSON.stringify({ title, content: article, excerpt, metaDescription, tags, heroImage }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ Article published successfully!');
        setArticle('');
        setTopic('');
        setTitle('');
        setHeroImage('');
        setExcerpt('');
        setMetaDescription('');
        setTags([]);
        setSourceUrl('');
        setSourceTitle('');
        loadArticles();
      } else {
        setMessage('❌ Publishing failed. Try again.');
      }
    } catch {
      setMessage('❌ Publishing failed. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleRemoveFAQ = async (fileName: string) => {
    if (!confirm(`Remove FAQ section from "${fileName.replace('.md', '').replace(/-/g, ' ')}"?`)) return;

    setProcessingArticle(fileName);
    setDeleteMessage('');

    try {
      const res = await fetch('/api/remove-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });

      const data = await res.json();

      if (data.success) {
        setDeleteMessage(`✅ FAQ removed successfully!`);
        loadArticles();
      } else {
        setDeleteMessage(`❌ Failed to remove FAQ: ${data.error}`);
      }
    } catch {
      setDeleteMessage('❌ Failed to remove FAQ. Try again.');
    } finally {
      setProcessingArticle(null);
    }
  };

  const loadArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles((data.files || []).map((f: any) => ({
        ...f,
        selected: false,
      })));
    } finally {
      setLoadingArticles(false);
    }
  };

  const triggerAutoPublish = async () => {
    setMessage('⏳ Triggering auto-publish...');
    try {
      const res = await fetch('/api/autopublish');
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ Auto-publish successful! Topic: ${data.topic}`);
        loadArticles();
      } else {
        setMessage(`❌ Auto-publish failed`);
      }
    } catch {
      setMessage('❌ Auto-publish failed. Try again.');
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadArticles();
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl w-full max-w-sm">
          <div className="text-white text-center mb-4">
            <Shield className="mx-auto mb-2" />
            Admin Login
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white"
              placeholder="Password"
            />

            <button className="w-full mt-4 bg-green-600 p-3 rounded text-white">
              Login
            </button>

            {message && (
              <p className="text-red-400 text-center mt-2">{message}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* (Rest of your UI remains EXACTLY the same — unchanged) */}
    </div>
  );
}
