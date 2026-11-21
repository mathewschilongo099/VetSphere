'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errMsg, post } from './api';
import { Card, Loading, Msg, btnGhost } from './ui';

interface Deployment {
  id: string;
  url: string;
  state: string;
  target: string;
  created: number;
  message: string;
  branch: string;
}

interface DeploymentsResponse {
  configured?: boolean;
  canRedeploy?: boolean;
  deployments?: Deployment[];
  error?: string;
}

const STATE_STYLE: Record<string, string> = {
  READY: 'bg-green-900/40 text-green-300',
  ERROR: 'bg-red-900/40 text-red-300',
  BUILDING: 'bg-yellow-900/40 text-yellow-300',
  QUEUED: 'bg-yellow-900/40 text-yellow-300',
  INITIALIZING: 'bg-yellow-900/40 text-yellow-300',
  CANCELED: 'bg-gray-700 text-gray-300',
};

const ago = (ms: number) => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
};

const ENV_VARS = [
  { key: 'GEMINI_API_KEY', desc: 'AI article generation' },
  { key: 'YOU_API_KEY', desc: 'Fallback AI + chatbot' },
  { key: 'GROQ_API_KEY', desc: 'Chatbot fallback' },
  { key: 'UNSPLASH_ACCESS_KEY', desc: 'Article photos and photo search' },
  { key: 'PEXELS_API_KEY', desc: 'Article photos and photo search' },
  { key: 'GITHUB_TOKEN', desc: 'Publishing and editing articles' },
  { key: 'GITHUB_OWNER', desc: 'Your GitHub username' },
  { key: 'GITHUB_REPO', desc: 'Your GitHub repo name' },
  { key: 'VERCEL_DEPLOY_HOOK', desc: 'Rebuild the site after changes' },
  { key: 'VERCEL_TOKEN', desc: 'Show recent deployments here' },
  { key: 'VERCEL_PROJECT_ID', desc: 'Show recent deployments here' },
  { key: 'VERCEL_TEAM_ID', desc: 'Only if the project is in a team' },
  { key: 'ADMIN_PASSWORD', desc: 'Admin login password (server only)' },
  { key: 'SESSION_SECRET', desc: 'Random string that signs admin sessions' },
  { key: 'CRON_SECRET', desc: 'Lets the scheduled GitHub job call autopublish' },
];

export default function SiteTab({ onChanged }: { onChanged: () => Promise<void> | void }) {
  // ── Deployments ──
  const [deploy, setDeploy] = useState<DeploymentsResponse | null>(null);
  const [loadingDeploy, setLoadingDeploy] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [deployMessage, setDeployMessage] = useState('');

  const loadDeployments = useCallback(async () => {
    setLoadingDeploy(true);
    try {
      setDeploy(await api<DeploymentsResponse>('/api/deployments'));
    } catch (e) {
      setDeployMessage(`❌ ${errMsg(e)}`);
    } finally {
      setLoadingDeploy(false);
    }
  }, []);

  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  const redeploy = async () => {
    if (!confirm('Rebuild the live site now?')) return;
    setRedeploying(true);
    setDeployMessage('');
    try {
      const data = await post<{ success?: boolean; error?: string }>('/api/deployments', {});
      setDeployMessage(
        data.success ? '✅ Rebuild started. It usually takes a minute or two.' : `❌ ${data.error || 'Could not start a rebuild'}`
      );
      if (data.success) setTimeout(loadDeployments, 4000);
    } catch (e) {
      setDeployMessage(`❌ ${errMsg(e)}`);
    } finally {
      setRedeploying(false);
    }
  };

  // ── Auto-publish ──
  const [running, setRunning] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');

  // The pipeline runs in four separate server calls so that each one stays
  // well inside the serverless time limit.
  const callStage = async (stage: string, body?: unknown) => {
    const res = await fetch(`/api/autopublish/${stage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      window.dispatchEvent(new Event('admin-unauthorized'));
      throw new Error('Your session expired. Please log in again.');
    }
    return res.json().catch(() => ({ ok: false, error: `Server error (${res.status})` }));
  };

  const runAutoPublish = async () => {
    setRunning(true);
    try {
      setAutoMessage('⏳ Step 1 of 4: finding a trending livestock topic...');
      const chosen = await callStage('topic');
      if (!chosen.ok) {
        setAutoMessage(
          chosen.skipped ? `⚠️ Skipped: ${chosen.reason}` : `❌ Topic search failed: ${chosen.error || 'Unknown error'}`
        );
        return;
      }

      setAutoMessage(`⏳ Step 2 of 4: researching "${chosen.topic.topic}"...`);
      const researched = await callStage('research', { topic: chosen.topic });
      if (!researched.ok) {
        setAutoMessage(
          researched.skipped
            ? `⚠️ Skipped: ${researched.reason}`
            : `❌ Research failed: ${researched.error || 'Unknown error'}`
        );
        return;
      }

      setAutoMessage(`⏳ Step 3 of 4: writing "${researched.research.topic}"...`);
      const written = await callStage('write', { research: researched.research });
      if (!written.ok) {
        setAutoMessage(
          written.skipped ? `⚠️ Skipped: ${written.reason}` : `❌ Writing failed: ${written.error || 'Unknown error'}`
        );
        return;
      }

      setAutoMessage('⏳ Step 4 of 4: fact-checking and publishing...');
      const published = await callStage('publish', { research: researched.research, draft: written.draft });
      if (published.ok) {
        setAutoMessage(`✅ Published: "${published.title}"`);
        await onChanged();
      } else if (published.skipped) {
        setAutoMessage(`⚠️ Not published: ${published.reason}`);
      } else {
        setAutoMessage(`❌ Publish failed: ${published.error || 'Unknown error'}`);
      }
    } catch (error) {
      setAutoMessage(`❌ ${errMsg(error, 'Auto-publish failed. Try again.')}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="🚀 Site rebuilds">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">Every change you save starts a rebuild of the live site.</p>
          <button onClick={loadDeployments} disabled={loadingDeploy} className="text-green-400 text-xs hover:underline shrink-0">
            {loadingDeploy ? '⏳' : '🔄 Refresh'}
          </button>
        </div>

        {deploy?.canRedeploy && (
          <button
            onClick={redeploy}
            disabled={redeploying}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            {redeploying ? '⏳ Starting...' : '🔁 Rebuild the site now'}
          </button>
        )}
        {deploy && !deploy.canRedeploy && (
          <p className="text-xs text-yellow-300">Set VERCEL_DEPLOY_HOOK to enable the rebuild button.</p>
        )}
        <Msg text={deployMessage} />

        {loadingDeploy && !deploy && <Loading text="Loading deployments..." />}
        {deploy && deploy.configured === false && (
          <p className="text-xs text-gray-400">
            To see recent deployments here, add VERCEL_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for a team project)
            in your Vercel environment variables.
          </p>
        )}
        {deploy?.error && <Msg text={`❌ ${deploy.error}`} />}
        <div className="space-y-2">
          {(deploy?.deployments || []).map((d) => (
            <a
              key={d.id}
              href={d.url ? `https://${d.url}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-700/60 hover:bg-gray-700 rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATE_STYLE[d.state] || 'bg-gray-700 text-gray-300'}`}>
                  {d.state}
                </span>
                <span className="text-[11px] text-gray-400">{d.target === 'production' ? 'Production' : 'Preview'}</span>
                <span className="text-[11px] text-gray-500 ml-auto">{d.created ? ago(d.created) : ''}</span>
              </div>
              <p className="text-xs text-gray-200 mt-1 truncate">{d.message || d.branch || d.url}</p>
            </a>
          ))}
        </div>
      </Card>

      <Card title="💾 Backup">
        <p className="text-xs text-gray-400">
          Download every article. The JSON file holds the full text; the CSV is a spreadsheet of titles, categories, status
          and tags.
        </p>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/articles/export" className={`${btnGhost} px-4 py-2 inline-block`}>
            ⬇️ Full backup (JSON)
          </a>
          <a href="/api/articles/export?format=csv" className={`${btnGhost} px-4 py-2 inline-block`}>
            ⬇️ Article list (CSV)
          </a>
        </div>
      </Card>

      <div className="bg-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-1">🤖 Auto-Publish</h2>
        <p className="text-gray-400 text-sm mb-4">Automatically generates and publishes veterinary articles.</p>
        <div className="bg-gray-700 rounded-xl p-4 mb-4 space-y-2 text-sm">
          {[
            { label: 'Schedule', value: '3 times daily' },
            { label: 'Next runs (UTC)', value: '6:00 AM · 12:00 PM · 6:00 PM' },
            { label: 'AI Model', value: 'Gemini 2.5 Flash (web research)' },
            { label: 'Images', value: 'Pexels' },
            { label: 'Topic source', value: 'Live news, last 7 days' },
            { label: 'Safety', value: 'Fact-check + quality gate' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-gray-400">{label}</span>
              <span className="text-white font-semibold text-right">{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={runAutoPublish}
          disabled={running}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
        >
          {running ? '⏳ Running...' : '▶️ Run Auto-Publish Now'}
        </button>
        <div className="mt-3">
          <Msg text={autoMessage} />
        </div>
      </div>

      <Card title="🔐 Security">
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-sm text-green-300">
          ✅ Login is checked on the server with a signed, HTTP-only session cookie. All admin APIs require it.
        </div>
        <p className="text-xs text-gray-400">
          To change the admin password, update ADMIN_PASSWORD in your Vercel environment variables and redeploy. To sign
          every device out, also change SESSION_SECRET. The password is never stored in the website itself, so it cannot
          be changed from this page.
        </p>
      </Card>

      <Card title="🔑 Environment variables">
        <div className="space-y-2">
          {ENV_VARS.map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3 bg-gray-700 rounded-xl px-4 py-2">
              <code className="text-green-400 text-xs">{key}</code>
              <span className="text-gray-400 text-xs text-right">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
