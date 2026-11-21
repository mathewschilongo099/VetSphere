'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AiTab from './components/AiTab';
import DashboardTab from './components/DashboardTab';
import LogsTab from './components/LogsTab';
import ManageTab from './components/ManageTab';
import MediaTab from './components/MediaTab';
import NewsTab from './components/NewsTab';
import PagesTab from './components/PagesTab';
import SeoTab from './components/SeoTab';
import SiteTab from './components/SiteTab';
import TaxonomyTab from './components/TaxonomyTab';
import WriteTab from './components/WriteTab';
import type { Tab } from './components/types';
import { Loading, Msg } from './components/ui';
import { useArticles } from './components/useArticles';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'write', label: '✍️ Write' },
  { id: 'manage', label: '🗂️ Articles' },
  { id: 'taxonomy', label: '🏷️ Tags' },
  { id: 'media', label: '🖼️ Media' },
  { id: 'seo', label: '🔎 SEO' },
  { id: 'pages', label: '📄 Pages' },
  { id: 'ai', label: '🤖 AI' },
  { id: 'news', label: '📰 News' },
  { id: 'logs', label: '📋 Logs' },
  { id: 'site', label: '⚙️ Site' },
];

type Auth = 'checking' | 'in' | 'out';

export default function AdminPage() {
  const [auth, setAuth] = useState<Auth>('checking');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editName, setEditName] = useState<string | null>(null);
  const { articles, loading, error, load } = useArticles();

  // A refresh keeps you signed in: ask the server whether the session cookie
  // is still valid. Any admin request that comes back 401 (for example after
  // the session expires) sends you back to the login screen.
  useEffect(() => {
    fetch('/api/admin-session')
      .then((res) => setAuth(res.ok ? 'in' : 'out'))
      .catch(() => setAuth('out'));
    const signedOut = () => setAuth('out');
    window.addEventListener('admin-unauthorized', signedOut);
    return () => window.removeEventListener('admin-unauthorized', signedOut);
  }, []);

  useEffect(() => {
    if (auth === 'in') load();
  }, [auth, load]);

  const reload = useCallback(() => load(true), [load]);

  const openEditor = (name: string) => {
    setEditName(name);
    setTab('write');
  };

  // The password is checked on the server, which then sets a signed,
  // HTTP-only session cookie. Nothing secret is shipped to the browser.
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPassword('');
        setAuth('in');
      } else {
        setLoginError(data.message || 'Wrong password. Please try again.');
      }
    } catch {
      setLoginError('Could not reach the server. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' }).catch(() => {});
    setEditName(null);
    setAuth('out');
  };

  if (auth === 'checking') {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
        <Loading text="Checking your session..." />
      </div>
    );
  }

  if (auth === 'out') {
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
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError('');
              }}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              disabled={loggingIn || !password}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
            >
              {loggingIn ? '⏳ Signing in...' : 'Login'}
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
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:underline">
                View Site →
              </a>
              <button onClick={logout} className="text-gray-400 hover:text-white text-sm transition">
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === 'write') setEditName(null);
                }}
                className={`px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm transition ${tab === t.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && tab !== 'manage' && (
            <div className="mb-4">
              <Msg text={`❌ ${error}`} />
            </div>
          )}

          {tab === 'dashboard' && (
            <DashboardTab
              articles={articles}
              loading={loading}
              onReload={reload}
              onOpen={(t) => {
                setTab(t);
                if (t === 'write') setEditName(null);
              }}
              onEdit={openEditor}
            />
          )}

          {/* Kept mounted (just hidden) so a generated article that is not published yet survives switching tabs. */}
          <div hidden={tab !== 'write'}>
            <WriteTab
              articles={articles}
              editName={editName}
              onClose={(goToManage) => {
                setEditName(null);
                if (goToManage) setTab('manage');
              }}
              onChanged={reload}
            />
          </div>

          {tab === 'manage' && (
            <ManageTab
              articles={articles}
              loading={loading}
              error={error}
              onReload={reload}
              onEdit={openEditor}
              onChanged={reload}
            />
          )}
          {tab === 'taxonomy' && <TaxonomyTab articles={articles} onChanged={reload} />}
          {tab === 'media' && <MediaTab articles={articles} onChanged={reload} />}
          {tab === 'seo' && <SeoTab articles={articles} onEdit={openEditor} />}
          {tab === 'pages' && <PagesTab />}
          {tab === 'ai' && <AiTab />}
          {tab === 'news' && <NewsTab />}
          {tab === 'logs' && <LogsTab />}
          {tab === 'site' && <SiteTab onChanged={reload} />}
        </div>
      </div>
    </div>
  );
}
