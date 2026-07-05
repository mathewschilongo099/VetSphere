import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    // Fail closed if the env var isn't set — never fall back to a hardcoded value
    return res.status(500).json({ success: false, message: 'Server misconfigured' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Wrong password' });
  }

  // Create a signed session token
  const sessionSecret = process.env.SESSION_SECRET || ADMIN_PASSWORD;
  const token = crypto
    .createHmac('sha256', sessionSecret)
    .update('admin-session')
    .digest('hex');

  res.setHeader(
    'Set-Cookie',
    serialize('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })
  );

  return res.status(200).json({ success: true });
}
