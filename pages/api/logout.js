import { SESSION_COOKIE } from '@/lib/auth';

export default function handler(req, res) {
  const cookie = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  res.setHeader('Set-Cookie', cookie.join('; '));
  return res.status(200).json({ ok: true });
}
