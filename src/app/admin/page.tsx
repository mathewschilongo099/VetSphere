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

  // URL Rewrite
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');

  // Articles Manager
  const [showManager, setShowManager] = useState(false);
  const [articles, setArticles] = useState<ArticleFile[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingArticle, setProcessingArticle] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'ChihAna21*') {
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

  // ✅ Updated: Fixed heroImage handling
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
        setHeroImage(data.heroImage || ''); // ✅ Fixed: Now properly sets hero image
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

  // ✅ Remove FAQ from an article
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
    setDeleteMessage('');
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles((data.files || []).map((f: { name: string; sha: string }) => ({
        ...f,
        selected: false,
      })));
    } catch {
      setDeleteMessage('Failed to load articles.');
    } finally {
      setLoadingArticles(false);
    }
  };

  const toggleSelect = (name: string) => {
    setArticles(prev =>
      prev.map(a => a.name === name ? { ...a, selected: !a.selected } : a)
    );
  };

  const selectAll = () => {
    setArticles(prev => prev.map(a => ({ ...a, selected: true })));
  };

  const deselectAll = () => {
    setArticles(prev => prev.map(a => ({ ...a, selected: false })));
  };

  const handleDelete = async () => {
    const selected = articles.filter(a => a.selected);
    if (selected.length === 0) {
      setDeleteMessage('Please select at least one article to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selected.length} article(s)? This cannot be undone.`)) return;

    setDeleting(true);
    setDeleteMessage('');

    try {
      const res = await fetch('/api/delete-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: selected.map(a => ({ name: a.name, sha: a.sha })) }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteMessage(`✅ Successfully deleted ${selected.length} article(s)!`);
        setArticles(prev => prev.filter(a => !a.selected));
      } else {
        setDeleteMessage('❌ Some deletions failed. Try again.');
      }
    } catch {
      setDeleteMessage('❌ Delete failed. Try again.');
    } finally {
      setDeleting(false);
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
        setMessage(`❌ Auto-publish failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      setMessage('❌ Auto-publish failed. Try again.');
    }
  };

  // Filter articles based on search
  const filteredArticles = articles.filter(article => {
    return article.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  useEffect(() => {
    if (authenticated) {
      loadArticles();
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">Admin Login</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your password to continue</p>
          </div>
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
    <div className="min-h-screen w-full bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-gray-400 hover:text-white transition lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <LayoutDashboard className="w-6 h-6 text-green-500" />
              <span className="text-white font-bold text-lg">VetSphere Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={triggerAutoPublish}
                className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Auto-Publish
              </button>
              <button
                onClick={() => setAuthenticated(false)}
                className="text-gray-400 hover:text-red-400 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4 fixed lg:static z-40 overflow-y-auto">
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setShowManager(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('write'); setShowManager(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${activeTab === 'write' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                <Plus className="w-5 h-5" />
                Write Article
              </button>
              <button
                onClick={() => { setActiveTab('manage'); setShowManager(true); loadArticles(); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${activeTab === 'manage' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                <FileText className="w-5 h-5" />
                Manage Articles
                <span className="ml-auto bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">
                  {articles.length}
                </span>
              </button>
              <button
                onClick={() => { setActiveTab('settings'); setShowManager(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Dashboard */}
            {activeTab === 'dashboard' && !showManager && (
              <>
                {/* Quick Actions */}
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => { setActiveTab('write'); setShowManager(false); }}
                      className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-green-500 transition group"
                    >
                      <div className="p-2 rounded-lg bg-green-600">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-300 group-hover:text-white transition">
                        New Article
                      </span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('write'); setShowManager(false); }}
                      className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500 transition group"
                    >
                      <div className="p-2 rounded-lg bg-purple-600">
                        <Link2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-300 group-hover:text-white transition">
                        Rewrite from URL
                      </span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('manage'); setShowManager(true); loadArticles(); }}
                      className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition group"
                    >
                      <div className="p-2 rounded-lg bg-blue-600">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-300 group-hover:text-white transition">
                        Manage Articles
                      </span>
                    </button>
                    <button
                      onClick={triggerAutoPublish}
                      className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition group"
                    >
                      <div className="p-2 rounded-lg bg-orange-600">
                        <RefreshCw className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-300 group-hover:text-white transition">
                        Run Auto-Publish
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recent Articles */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Recent Articles
                  </h2>
                  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="divide-y divide-gray-700">
                      {articles.slice(0, 5).map((article, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-700 transition">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-200">
                                {article.name.replace('.md', '').replace(/-/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/articles/${article.name.replace('.md', '')}`}
                            className="text-sm text-green-400 hover:underline"
                          >
                            View →
                          </Link>
                        </div>
                      ))}
                      {articles.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No articles yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Write Article */}
            {activeTab === 'write' && !showManager && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Write New Article</h2>
                  <p className="text-gray-400 text-sm">Generate from topic or rewrite from URL</p>
                </div>

                {/* Generate from URL */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    🔗 Generate from URL
                  </h3>
                  <form onSubmit={handleGenerateFromUrl} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="flex-1 px-5 py-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="submit"
                      disabled={urlLoading || !sourceUrl.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl transition flex items-center gap-2 whitespace-nowrap"
                    >
                      {urlLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Generate from URL
                        </>
                      )}
                    </button>
                  </form>
                  {sourceTitle && (
                    <p className="text-xs text-gray-400 mt-2">
                      Source: <span className="text-gray-300">{sourceTitle}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 border-t border-gray-700"></div>
                  <span className="text-xs text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-700"></div>
                </div>

                {/* Generate from Topic */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    ✍️ Generate from Topic
                  </h3>
                  <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter article topic e.g. Foot and Mouth Disease"
                      className="flex-1 px-5 py-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <button
                      type="submit"
                      disabled={generating || !topic.trim()}
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl transition flex items-center gap-2 whitespace-nowrap"
                    >
                      {generating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </form>
                </div>

                {message && (
                  <p className={`text-center text-sm mb-4 ${message.includes('✅') ? 'text-green-400' : message.includes('❌') ? 'text-red-400' : 'text-yellow-400'}`}>
                    {message}
                  </p>
                )}

                {heroImage && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <img src={heroImage} alt={title} className="w-full h-48 object-cover" />
                    <p className="text-gray-400 text-xs text-center mt-1">Hero image from Unsplash</p>
                  </div>
                )}

                {article && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">SEO Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-5 py-3 rounded-xl bg-gray-800 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Meta Description</label>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        rows={2}
                        className="w-full px-5 py-3 rounded-xl bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/155 characters</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">SEO Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                          <span key={i} className="bg-green-800 text-green-200 text-xs px-3 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Article Content</label>
                      <textarea
                        value={article}
                        onChange={(e) => setArticle(e.target.value)}
                        rows={20}
                        className="w-full px-5 py-4 rounded-xl bg-gray-800 text-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400 font-mono"
                      />
                    </div>
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition mb-10"
                    >
                      {publishing ? 'Publishing...' : '📤 Publish Article'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Manage Articles */}
            {showManager && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Manage Articles</h2>
                  <p className="text-gray-400 text-sm">View, search, and delete articles</p>
                </div>

                {/* Search */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition"
                  >
                    Clear
                  </button>
                </div>

                {/* Bulk Actions */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button onClick={selectAll} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-xl transition">
                    Select All
                  </button>
                  <button onClick={deselectAll} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-xl transition">
                    Deselect All
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || articles.filter(a => a.selected).length === 0}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : `Delete Selected (${articles.filter(a => a.selected).length})`}
                  </button>
                </div>

                {deleteMessage && (
                  <p className={`text-center text-sm mb-4 ${deleteMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {deleteMessage}
                  </p>
                )}

                {/* Articles List */}
                {loadingArticles && (
                  <p className="text-center text-gray-400 py-8">Loading articles...</p>
                )}

                {!loadingArticles && articles.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No articles found.</p>
                )}

                <div className="space-y-2">
                  {paginatedArticles.map((a) => (
                    <div
                      key={a.name}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${a.selected ? 'bg-red-900/50 border border-red-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                    >
                      <div
                        onClick={() => toggleSelect(a.name)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${a.selected ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}
                      >
                        {a.selected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="text-sm text-gray-200 truncate flex-1">
                        {a.name.replace('.md', '').replace(/-/g, ' ')}
                      </span>
                      {/* ✅ Remove FAQ Button */}
                      <button
                        onClick={() => handleRemoveFAQ(a.name)}
                        disabled={processingArticle === a.name}
                        className="text-xs bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white px-3 py-1 rounded-xl transition whitespace-nowrap"
                      >
                        {processingArticle === a.name ? '...' : 'Remove FAQ'}
                      </button>
                      <Link
                        href={`/articles/${a.name.replace('.md', '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-green-400 hover:text-green-300 text-sm transition"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition"
                    >
                      Previous
                    </button>
                    <span className="text-gray-400 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Settings */}
            {activeTab === 'settings' && !showManager && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Auto-Publish Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300">Auto-Publish Schedule</p>
                        <p className="text-gray-400 text-sm">Runs daily at 8:00 AM UTC</p>
                      </div>
                      <button
                        onClick={triggerAutoPublish}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl transition text-sm font-bold"
                      >
                        <RefreshCw className="w-4 h-4 inline mr-1" />
                        Run Now
                      </button>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-gray-300">News Sources</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                        <span className="text-gray-400 text-sm">GNews API</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                        <span className="text-gray-400 text-sm">Google News RSS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around p-3 z-50">
        <button
          onClick={() => { setActiveTab('dashboard'); setShowManager(false); }}
          className={`p-2 rounded-xl transition ${activeTab === 'dashboard' ? 'text-green-500' : 'text-gray-400'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setActiveTab('write'); setShowManager(false); }}
          className={`p-2 rounded-xl transition ${activeTab === 'write' ? 'text-green-500' : 'text-gray-400'}`}
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setActiveTab('manage'); setShowManager(true); loadArticles(); }}
          className={`p-2 rounded-xl transition ${activeTab === 'manage' ? 'text-green-500' : 'text-gray-400'}`}
        >
          <FileText className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setShowManager(false); }}
          className={`p-2 rounded-xl transition ${activeTab === 'settings' ? 'text-green-500' : 'text-gray-400'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
