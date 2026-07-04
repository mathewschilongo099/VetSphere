import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const { password } = req.body;

  const ADMIN_PASSWORD = 'ChihAna21*';

  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({
    success: false,
    message: 'Wrong password',
  });
)
