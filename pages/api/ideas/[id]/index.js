import { isAuthedRequestCookie } from '@/lib/auth';
import { updateIdea, deleteIdea } from '@/lib/ideas/store';

// Same size ceiling reasoning as pages/api/ideas/index.js's create route -
// capped below Vercel's own hard ~4.5MB serverless function request-body
// limit, which rejects anything larger before this code ever runs.
export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
  },
};

export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { title, description, timeline, imageBase64, imageType } = req.body || {};
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ ok: false, error: 'Title is required' });
    }
    try {
      const idea = await updateIdea(id, { title, description, timeline, imageBase64, imageType });
      return res.status(200).json({ ok: true, idea });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteIdea(id);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
