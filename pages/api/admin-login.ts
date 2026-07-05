import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ success: false, message: 'Server misconfigured' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Wrong password' });
  }

  const sessionSecret = process.env.SESSION_SECRET || ADMIN_PASSWORD;
  const token = crypto
    .createHmac('sha256', sessionSecret)
    .update('admin-session')
    .digest('hex');

  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `admin_session=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${60 * 60 * 8}`,
    isProd ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookie);

  return res.status(200).json({ success: true });
}
