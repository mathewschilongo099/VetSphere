// Admin session helpers. Uses the Web Crypto API so the same code runs in the
// Edge middleware and in Node API routes.
//
// Token format: "<expiresAtMs>.<hexHmac>" where the HMAC covers "admin:<expiresAtMs>".
// Required env vars: ADMIN_PASSWORD, and ideally SESSION_SECRET (falls back to
// ADMIN_PASSWORD as the signing key if SESSION_SECRET is not set).

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

const encoder = new TextEncoder();

function getSecret(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(signature);
}

// Constant-time string comparison.
export function safeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const signature = await sign(`admin:${expiresAt}`, secret);
  return `${expiresAt}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiresAt = Number(token.slice(0, dot));
  const signature = token.slice(dot + 1);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await sign(`admin:${expiresAt}`, secret);
  return safeEqual(signature, expected);
}

// True when the request carries "Authorization: Bearer <CRON_SECRET>".
export function hasValidCronSecret(authorizationHeader: string | null | undefined): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authorizationHeader) return false;
  return safeEqual(authorizationHeader, `Bearer ${cronSecret}`);
}
