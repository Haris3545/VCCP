import { isAuthedRequestCookie } from '@/lib/auth';
import { setIdeasStatus } from '@/lib/ideas/store';

export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { ids, status } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ ok: false, error: 'ids must be a non-empty array' });
  }

  try {
    const ideas = await setIdeasStatus(ids, status);
    return res.status(200).json({ ok: true, ideas });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
}
