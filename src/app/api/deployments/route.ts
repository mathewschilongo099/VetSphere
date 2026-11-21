export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { triggerDeploy } from '@/lib/admin/github';

interface VercelDeployment {
  uid: string;
  url?: string;
  state?: string;
  readyState?: string;
  target?: string | null;
  created?: number;
  meta?: { githubCommitMessage?: string; githubCommitRef?: string };
}

// Recent deployments. Needs VERCEL_TOKEN and VERCEL_PROJECT_ID (and
// VERCEL_TEAM_ID when the project belongs to a team).
export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const canRedeploy = Boolean(process.env.VERCEL_DEPLOY_HOOK);
  if (!token || !projectId) {
    return NextResponse.json({ configured: false, canRedeploy });
  }

  try {
    const query = new URLSearchParams({ projectId, limit: '10' });
    if (process.env.VERCEL_TEAM_ID) query.set('teamId', process.env.VERCEL_TEAM_ID);
    const res = await fetch(`https://api.vercel.com/v6/deployments?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        canRedeploy,
        error: `Vercel answered with status ${res.status}. Check VERCEL_TOKEN, VERCEL_PROJECT_ID and VERCEL_TEAM_ID.`,
      });
    }
    const data = await res.json();
    const deployments = ((data.deployments || []) as VercelDeployment[]).map((d) => ({
      id: d.uid,
      url: d.url || '',
      state: d.state || d.readyState || 'UNKNOWN',
      target: d.target || 'preview',
      created: d.created || 0,
      message: d.meta?.githubCommitMessage || '',
      branch: d.meta?.githubCommitRef || '',
    }));
    return NextResponse.json({ configured: true, canRedeploy, deployments });
  } catch {
    return NextResponse.json({ configured: true, canRedeploy, error: 'Could not reach Vercel.' });
  }
}

// Starts a new production build using the existing deploy hook.
export async function POST() {
  if (!process.env.VERCEL_DEPLOY_HOOK) {
    return NextResponse.json(
      { success: false, error: 'VERCEL_DEPLOY_HOOK is not set, so a redeploy cannot be started from here.' },
      { status: 400 }
    );
  }
  const ok = await triggerDeploy();
  return NextResponse.json(
    ok ? { success: true } : { success: false, error: 'Vercel did not accept the redeploy request.' },
    { status: ok ? 200 : 502 }
  );
}
