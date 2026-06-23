'use client';

import { useState } from 'react';

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

  // Articles Manager
  const [showManager, setShowManager] = useState(false);
  const [articles, setArticles] = useState<ArticleFile[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

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
        body: JSON.stringify({ title, content: article, excerpt, metaDescription, tags, heroImage }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Article published successfully!');
        setArticle('');
        setTopic('');
        setTitle('');
        setHeroImage('');
        setExcerpt('');
        setMetaDescription('');
        setTags([]);
      } else {
        setMessage('Publishing failed. Try again.');
      }
    } catch {
      setMessage('Publishing failed. Try again.');
    } finally {
      setPublishing(false);
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

  if (!authenticated) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center px-4">
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
    <div className="w-full bg-gray-900 text-white" style={{ minHeight: '100vh' }}>
      <div className="w-full bg-gray-900 px-4 py-10 pb-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-center">VetSphere Admin</h1>

          {/* Tab Buttons */}
          <div className="flex gap-3 mb-8 justify-center flex-wrap">
            <button
              onClick={() => setShowManager(false)}
              className={`px-6 py-3 rounded-xl font-bold transition ${!showManager ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              ✍️ Write Article
            </button>
            <button
              onClick={() => { setShowManager(true); loadArticles(); }}
              className={`px-6 py-3 rounded-xl font-bold transition ${showManager ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              🗂️ Manage Articles
            </button>
          </div>

          {/* Articles Manager */}
          {showManager && (
            <div>
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
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
                >
                  {deleting ? 'Deleting...' : `🗑️ Delete Selected (${articles.filter(a => a.selected).length})`}
                </button>
              </div>

              {deleteMessage && (
                <p className={`text-center text-sm mb-4 ${deleteMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                  {deleteMessage}
                </p>
              )}

              {loadingArticles && (
                <p className="text-center text-gray-400 py-8">Loading articles...</p>
              )}

              {!loadingArticles && articles.length === 0 && (
                <p className="text-center text-gray-400 py-8">No articles found.</p>
              )}

              <div className="space-y-2">
                {articles.map((a) => (
                  <div
                    key={a.name}
                    onClick={() => toggleSelect(a.name)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${a.selected ? 'bg-red-900/50 border border-red-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${a.selected ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                      {a.selected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-gray-200 truncate">
                      {a.name.replace('.md', '').replace(/-/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Write Article */}
          {!showManager && (
            <>
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
                    <label className="text-xs text-gray-400 mb-1 block">Meta Description (shown on Google)</label>
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
                          {tag}
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
                      className="w-full px-5 py-4 rounded-xl bg-gray-800 text-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition mb-10"
                  >
                    {publishing ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
