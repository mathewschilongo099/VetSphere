'use client';

import { useState, useEffect, useCallback } from 'react';

interface ArticleFile {
  name: string;
  sha: string;
  selected: boolean;
}

interface Stats {
  totalArticles: number;
  publishedToday: number;
  autoPublished: number;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface LogItem {
  message: string;
  date: string;
  sha: string;
  url: string;
}

type Tab = 'dashboard' | 'write' | 'manage' | 'settings' | 'news' | 'logs';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loginError, setLoginError] = useState('');

  // Write Article
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState('');
  const [title, setTitle] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [writeMessage, setWriteMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Manage Articles
  const [articles, setArticles] = useState<ArticleFile[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [manageMessage, setManageMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ARTICLES_PER_PAGE = 20;

  // Stats
  const [stats, setStats] = useState<Stats>({ totalArticles: 0, publishedToday: 0, autoPublished: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // Settings
  const [autoPublishRunning, setAutoPublishRunning] = useState(false);
  const [autoPublishMessage, setAutoPublishMessage] = useState('');

  // News
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // Logs
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ── LOAD STATS ──
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      const files: { name: string }[] = data.files || [];
      const today = new Date().toISOString().split('T')[0];
      const todayCount = files.filter(f => f.name.includes(today)).length;
      setStats({
        totalArticles: files.length,
        publishedToday: todayCount,
        autoPublished: files.filter(f => f.name !== 'common-cattle-diseases.md').length,
      });
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── LOAD ARTICLES ──
  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    setManageMessage('');
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles((data.files || []).map((f: { name: string; sha: string }) => ({
        ...f,
        selected: false,
      })));
    } catch {
      setManageMessage('❌ Failed to load articles.');
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  // ── LOAD NEWS ──
  const loadNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data.news || []);
    } catch {
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  }, []);

  // ── LOAD LOGS ──
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'manage') loadArticles();
    if (activeTab === 'news') loadNews();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab, loadArticles, loadNews, loadLogs]);

  // ── LOGIN ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ChihAna21*';
    if (password === adminPassword) {
      setAuthenticated(true);
      loadStats();
    } else {
      setLoginError('Wrong password. Please try again.');
    }
  };

  // ── GENERATE ──
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setWriteMessage('');
    setArticle('');
    setHeroImage('');
    setExcerpt('');
    setMetaDescription('');
    setTags([]);
    setShowPreview(false);

    try {
      const res = await fetch(`/api/generate?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      if (data.error) {
        setWriteMessage(`❌ ${data.error}`);
        return;
      }
      setArticle(data.content || '');
      setTitle(data.title || topic);
      setHeroImage(data.heroImage || '');
      setExcerpt(data.excerpt || '');
      setMetaDescription(data.metaDescription || '');
      setTags(data.tags || []);
      setWriteMessage('✅ Article generated! Review it below then publish.');
    } catch {
      setWriteMessage('❌ Failed to generate. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── PUBLISH ──
  const handlePublish = async () => {
    if (!article.trim()) return;
    setPublishing(true);
    setWriteMessage('');

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: article, excerpt, metaDescription, tags, heroImage }),
      });
      const data = await res.json();
      if (data.success) {
        setWriteMessage('✅ Article published! Site is rebuilding...');
        setArticle('');
        setTopic('');
        setTitle('');
        setHeroImage('');
        setExcerpt('');
        setMetaDescription('');
        setTags([]);
        setShowPreview(false);
        loadStats();
      } else if (data.skipped) {
        setWriteMessage(`⚠️ ${data.reason}`);
      } else {
        setWriteMessage(`❌ Publishing failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      setWriteMessage('❌ Publishing failed. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async () => {
    const selected = articles.filter(a => a.selected);
    if (selected.length === 0) {
      setManageMessage('⚠️ Select at least one article to delete.');
      return;
    }
    if (!confirm(`Delete ${selected.length} article(s)? This cannot be undone.`)) return;

    setDeleting(true);
    setManageMessage('');

    try {
      const res = await fetch('/api/delete-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: selected.map(a => ({ name: a.name, sha: a.sha })) }),
      });
      const data = await res.json();
      if (data.success) {
        setManageMessage(`✅ Deleted ${data.deleted} article(s) successfully!`);
        setArticles(prev => prev.filter(a => !a.selected));
        loadStats();
      } else {
        setManageMessage('❌ Delete failed. Try again.');
      }
    } catch {
      setManageMessage('❌ Delete failed. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  // ── AUTO-PUBLISH NOW ──
  const handleRunAutoPublish = async () => {
    setAutoPublishRunning(true);
    setAutoPublishMessage('⏳ Running auto-publish...');
    try {
      const res = await fetch('/api/autopublish');
      const data = await res.json();
      if (data.success) {
        setAutoPublishMessage(`✅ Published: "${data.title}"`);
        loadStats();
      } else if (data.skipped) {
        setAutoPublishMessage(`⚠️ Skipped: ${data.reason}`);
      } else {
        setAutoPublishMessage(`❌ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      setAutoPublishMessage('❌ Auto-publish failed. Try again.');
    } finally {
      setAutoPublishRunning(false);
    }
  };

  const toggleSelect = (name: string) => {
    setArticles(prev => prev.map(a => a.name === name ? { ...a, selected: !a.selected } : a));
  };

  const selectAll = () => setArticles(prev => prev.map(a => ({ ...a, selected: true })));
  const deselectAll = () => setArticles(prev => prev.map(a => ({ ...a, selected: false })));

  const filteredArticles = articles.filter(a =>
    a.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // ── LOGIN PAGE ──
  if (!authenticated) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <span className="text-4xl">🐾</span>
            <h1 className="text-white text-2xl font-bold mt-2">VetSphere Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to manage your website</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition"
            >
              Login
            </button>
            {loginError && <p className="text-red-400 text-center text-sm">{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 text-white" style={{ minHeight: '100vh' }}>
      <div className="w-full px-4 py-6 pb-24">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">🐾 VetSphere Admin</h1>
              <p className="text-gray-400 text-sm">Manage your veterinary platform</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/articles" target="_blank" className="text-green-400 text-sm hover:underline">
                View Site →
              </a>
              <button onClick={() => setAuthenticated(false)} className="text-gray-400 hover:text-white text-sm transition">
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {([
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'write', label: '✍️ Write' },
              { id: 'manage', label: '🗂️ Manage' },
              { id: 'news', label: '📰 News' },
              { id: 'logs', label: '📋 Logs' },
              { id: 'settings', label: '⚙️ Settings' },
            ] as { id: Tab; label: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                  activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Overview</h2>
                <button onClick={loadStats} disabled={loadingStats} className="text-green-400 text-sm hover:underline">
                  {loadingStats ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold text-green-400">{loadingStats ? '...' : stats.totalArticles}</p>
                  <p className="text-gray-400 text-sm mt-1">Total Articles</p>
                </div>
                <div className="bg-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold text-blue-400">{loadingStats ? '...' : stats.publishedToday}</p>
                  <p className="text-gray-400 text-sm mt-1">Published Today</p>
                </div>
                <div className="bg-gray-800 rounded-2xl p-5 text-center col-span-2 sm:col-span-1">
                  <p className="text-3xl font-bold text-purple-400">{loadingStats ? '...' : stats.autoPublished}</p>
                  <p className="text-gray-400 text-sm mt-1">Auto Published</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { tab: 'write' as Tab, icon: '✍️', title: 'Write New Article', desc: 'Generate and publish a new article' },
                  { tab: 'manage' as Tab, icon: '🗂️', title: 'Manage Articles', desc: 'View, search and delete articles' },
                  { tab: 'news' as Tab, icon: '📰', title: 'Veterinary News', desc: 'Latest animal health news' },
                  { tab: 'logs' as Tab, icon: '📋', title: 'System Logs', desc: 'Recent publish activity' },
                ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-5 rounded-2xl transition text-left px-6"
                  >
                    <p className="text-lg">{item.icon} {item.title}</p>
                    <p className="text-gray-400 text-sm font-normal mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── WRITE ARTICLE ── */}
          {activeTab === 'write' && (
            <div className="space-y-4">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic e.g. Milk Fever in Dairy Cows"
                  className="flex-1 px-5 py-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="submit"
                  disabled={generating || !topic.trim()}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl transition whitespace-nowrap"
                >
                  {generating ? '⏳' : 'Generate'}
                </button>
              </form>

              {writeMessage && (
                <p className={`text-center text-sm py-2 px-4 rounded-xl ${
                  writeMessage.includes('✅') ? 'bg-green-900/30 text-green-400' :
                  writeMessage.includes('⚠️') ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {writeMessage}
                </p>
              )}

              {heroImage && (
                <div className="rounded-xl overflow-hidden">
                  <img src={heroImage} alt={title} className="w-full h-48 object-cover" />
                  <p className="text-gray-400 text-xs text-center mt-1">Hero image</p>
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
                      className="w-full px-5 py-3 rounded-xl bg-gray-800 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-green-400"
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
                    <p className={`text-xs mt-1 ${metaDescription.length > 155 ? 'text-red-400' : 'text-gray-500'}`}>
                      {metaDescription.length}/155 characters
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">SEO Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <span key={i} className="bg-green-800 text-green-200 text-xs px-3 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Preview Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(false)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!showPreview ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setShowPreview(true)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${showPreview ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      👁️ Preview
                    </button>
                  </div>

                  {!showPreview ? (
                    <textarea
                      value={article}
                      onChange={(e) => setArticle(e.target.value)}
                      rows={20}
                      className="w-full px-5 py-4 rounded-xl bg-gray-800 text-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  ) : (
                    <div className="bg-white text-gray-900 rounded-xl p-6 prose prose-sm max-w-none min-h-64 overflow-auto">
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{article}</pre>
                    </div>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition"
                  >
                    {publishing ? '⏳ Publishing...' : '🚀 Publish Article'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MANAGE ARTICLES ── */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Articles ({filteredArticles.length})</h2>
                <button onClick={loadArticles} disabled={loadingArticles} className="text-green-400 text-sm hover:underline">
                  {loadingArticles ? '⏳' : '🔄 Refresh'}
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="🔍 Search articles..."
                className="w-full px-5 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />

              <div className="flex gap-2 flex-wrap">
                <button onClick={selectAll} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-xl transition">
                  Select All
                </button>
                <button onClick={deselectAll} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-xl transition">
                  Deselect All
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || articles.filter(a => a.selected).length === 0}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
                >
                  {deleting ? '⏳ Deleting...' : `🗑️ Delete (${articles.filter(a => a.selected).length})`}
                </button>
              </div>

              {manageMessage && (
                <p className={`text-center text-sm py-2 px-4 rounded-xl ${
                  manageMessage.includes('✅') ? 'bg-green-900/30 text-green-400' :
                  manageMessage.includes('⚠️') ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {manageMessage}
                </p>
              )}

              {loadingArticles && <p className="text-center text-gray-400 py-8">⏳ Loading articles...</p>}

              {!loadingArticles && filteredArticles.length === 0 && (
                <p className="text-center text-gray-400 py-8">No articles found.</p>
              )}

              <div className="space-y-2">
                {paginatedArticles.map((a) => (
                  <div
                    key={a.name}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      a.selected ? 'bg-red-900/40 border border-red-500' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div
                      onClick={() => toggleSelect(a.name)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition ${
                        a.selected ? 'bg-red-500 border-red-500' : 'border-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {a.selected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span
                      onClick={() => toggleSelect(a.name)}
                      className="text-sm text-gray-200 truncate flex-1 cursor-pointer capitalize"
                    >
                      {a.name.replace('.md', '').replace(/-/g, ' ')}
                    </span>
                    <a
                      href={`/articles/${a.name.replace('.md', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 text-xs hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-green-900/30 transition"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc: (number | string)[], p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => (
                      <button
                        key={i}
                        onClick={() => typeof p === 'number' && setCurrentPage(p)}
                        disabled={p === '...'}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                          p === currentPage ? 'bg-green-600 text-white' :
                          p === '...' ? 'text-gray-500 cursor-default' :
                          'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── NEWS TAB ── */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">📰 Veterinary News</h2>
                <button onClick={loadNews} disabled={loadingNews} className="text-green-400 text-sm hover:underline">
                  {loadingNews ? '⏳' : '🔄 Refresh'}
                </button>
              </div>

              {loadingNews && <p className="text-center text-gray-400 py-8">⏳ Loading news...</p>}

              {!loadingNews && news.length === 0 && (
                <p className="text-center text-gray-400 py-8">No news found.</p>
              )}

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
          )}

          {/* ── LOGS TAB ── */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">📋 System Logs</h2>
                <button onClick={loadLogs} disabled={loadingLogs} className="text-green-400 text-sm hover:underline">
                  {loadingLogs ? '⏳' : '🔄 Refresh'}
                </button>
              </div>

              {loadingLogs && <p className="text-center text-gray-400 py-8">⏳ Loading logs...</p>}

              {!loadingLogs && logs.length === 0 && (
                <p className="text-center text-gray-400 py-8">No logs found.</p>
              )}

              <div className="space-y-2">
                {logs.map((log, i) => (
                  <a
                    key={i}
                    href={log.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm leading-snug flex-1">{log.message}</p>
                      <span className="text-green-400 text-xs font-mono shrink-0">{log.sha}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {log.date ? new Date(log.date).toLocaleString() : ''}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="space-y-6">

              {/* Auto-publish */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-1">🤖 Auto-Publish</h2>
                <p className="text-gray-400 text-sm mb-4">Automatically generates and publishes veterinary articles.</p>
                <div className="bg-gray-700 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  {[
                    { label: 'Schedule', value: '3 times daily' },
                    { label: 'Next runs (UTC)', value: '6:00 AM · 12:00 PM · 6:00 PM' },
                    { label: 'AI Model', value: 'Gemini 2.5 Flash' },
                    { label: 'Images', value: 'Pexels + Unsplash' },
                    { label: 'Topic source', value: 'Google News + Fallback list' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRunAutoPublish}
                  disabled={autoPublishRunning}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                >
                  {autoPublishRunning ? '⏳ Running...' : '▶️ Run Auto-Publish Now'}
                </button>
                {autoPublishMessage && (
                  <p className={`text-center text-sm mt-3 py-2 px-4 rounded-xl ${
                    autoPublishMessage.includes('✅') ? 'bg-green-900/30 text-green-400' :
                    autoPublishMessage.includes('⚠️') ? 'bg-yellow-900/30 text-yellow-400' :
                    autoPublishMessage.includes('⏳') ? 'bg-gray-700 text-gray-300' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {autoPublishMessage}
                  </p>
                )}
              </div>

              {/* Security */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-1">🔐 Security</h2>
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-sm text-yellow-300">
                  ⚠️ Store your admin password in Vercel as <code className="bg-gray-700 px-1 rounded">NEXT_PUBLIC_ADMIN_PASSWORD</code> — never hardcode it in your source code.
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">🔑 Environment Variables</h2>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'GEMINI_API_KEY', desc: 'AI article generation' },
                    { key: 'YOU_API_KEY', desc: 'Fallback AI + chatbot' },
                    { key: 'UNSPLASH_ACCESS_KEY', desc: 'Article images' },
                    { key: 'PEXELS_API_KEY', desc: 'Article images fallback' },
                    { key: 'GITHUB_TOKEN', desc: 'Publishing articles' },
                    { key: 'GITHUB_OWNER', desc: 'Your GitHub username' },
                    { key: 'GITHUB_REPO', desc: 'Your GitHub repo name' },
                    { key: 'VERCEL_DEPLOY_HOOK', desc: 'Auto redeploy after publish' },
                    { key: 'NEXT_PUBLIC_ADMIN_PASSWORD', desc: 'Admin login password' },
                  ].map(({ key, desc }) => (
                    <div key={key} className="flex items-center justify-between bg-gray-700 rounded-xl px-4 py-2">
                      <code className="text-green-400 text-xs">{key}</code>
                      <span className="text-gray-400 text-xs">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
