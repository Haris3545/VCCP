import { isAuthedRequestCookie } from '@/lib/auth';
import { setIdeaStatus } from '@/lib/ideas/store';

export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status } = req.body || {};

  try {
    const idea = await setIdeaStatus(id, status);
    return res.status(200).json({ ok: true, idea });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
}
