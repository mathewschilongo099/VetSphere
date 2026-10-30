import type { NextApiRequest, NextApiResponse } from 'next';
import { SESSION_COOKIE } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    [`${SESSION_COOKIE}=`, 'HttpOnly', 'Path=/', 'SameSite=Strict', 'Max-Age=0', isProd ? 'Secure' : '']
      .filter(Boolean)
      .join('; ')
  );
  return res.status(200).json({ success: true });
}
