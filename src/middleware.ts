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

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, PUBLIC_API_PREFIXES)) {
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
