import artistConfig from '@/lib/artist.config';
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (password !== artistConfig.loginPassword) {
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  }

  const cookie = [
    `${SESSION_COOKIE}=${SESSION_VALUE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  res.setHeader('Set-Cookie', cookie.join('; '));
  return res.status(200).json({ ok: true });
}
