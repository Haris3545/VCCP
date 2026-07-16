import { isAuthedRequestCookie } from '@/lib/auth';
import { resetIdeas } from '@/lib/ideas/store';

export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const ideas = await resetIdeas();
    return res.status(200).json({ ok: true, ideas });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
}
