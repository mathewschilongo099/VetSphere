import type { NextApiRequest, NextApiResponse } from 'next';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, safeEqual } from '@/lib/auth';

// Very small in-memory brute-force limiter (per server instance). It slows
// down guessing; the real protection is a long, random ADMIN_PASSWORD.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (value || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ success: false, message: 'Admin login is not configured on the server.' });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && now - record.first < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || !safeEqual(password, adminPassword)) {
    if (!record || now - record.first >= WINDOW_MS) {
      attempts.set(ip, { count: 1, first: now });
    } else {
      record.count += 1;
    }
    return res.status(401).json({ success: false, message: 'Wrong password' });
  }

  attempts.delete(ip);

  const token = await createSessionToken();
  if (!token) {
    return res.status(500).json({ success: false, message: 'Server misconfigured' });
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
