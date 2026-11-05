import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, hasValidCronSecret, verifySessionToken } from '@/lib/auth';

// Every /api route is private unless it is listed here. New routes are
// therefore protected by default (fail closed).
const PUBLIC_API_PREFIXES = [
  '/api/admin-login', // issues the session cookie
  '/api/admin-logout',
  '/api/search', // Ask VetSphere chatbot
  '/api/quiz',
  '/api/generate-faqs', // used by public article pages
  '/api/academic-writer',
  '/api/python-pptx', // called server-to-server by academic-writer
  '/api/posts',
  '/api/categories',
];

// Routes that the scheduled GitHub Action may call with the CRON_SECRET.
const CRON_API_PREFIXES = ['/api/autopublish'];

// Public routes that spend AI-provider quota or server CPU. Each client IP is
// limited per route so a script cannot drain the Gemini/Groq/You.com quotas.
const RATE_LIMITED_PREFIXES = [
  '/api/search',
  '/api/quiz',
  '/api/generate-faqs',
  '/api/academic-writer',
  '/api/python-pptx',
];
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_MAX_TRACKED = 5000;

// Best effort: this map lives in one server instance, so the limit is
// approximate on serverless hosting. It still stops casual abuse.
const hits = new Map<string, { count: number; start: number }>();

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded ? forwarded.split(',')[0].trim() : '';
  return first || request.headers.get('x-real-ip') || 'unknown';
}

// Returns the number of seconds to wait when the client is over the limit,
// or null when the request is allowed.
function checkRateLimit(ip: string, pathname: string): number | null {
  const prefix = RATE_LIMITED_PREFIXES.find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!prefix) return null;

  const now = Date.now();
  if (hits.size > RATE_LIMIT_MAX_TRACKED) {
    for (const [key, value] of hits) {
      if (now - value.start >= RATE_LIMIT_WINDOW_MS) hits.delete(key);
    }
    if (hits.size > RATE_LIMIT_MAX_TRACKED) hits.clear();
  }

  const key = `${ip}|${prefix}`;
  const record = hits.get(key);
  if (!record || now - record.start >= RATE_LIMIT_WINDOW_MS) {
    hits.set(key, { count: 1, start: now });
    return null;
  }
  record.count += 1;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return Math.max(1, Math.ceil((record.start + RATE_LIMIT_WINDOW_MS - now) / 1000));
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, PUBLIC_API_PREFIXES)) {
    const retryAfter = checkRateLimit(clientIp(request), pathname);
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down and try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }
    return NextResponse.next();
  }

  if (matchesPrefix(pathname, CRON_API_PREFIXES)) {
    if (hasValidCronSecret(request.headers.get('authorization'))) {
      return NextResponse.next();
    }
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(session)) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export const config = {
  matcher: ['/api/:path*'],
};
