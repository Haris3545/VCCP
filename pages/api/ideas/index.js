import { isAuthedRequestCookie } from '@/lib/auth';
import { listIdeas, addIdea } from '@/lib/ideas/store';

// Base64-encoded images inflate ~33% over raw bytes and ride inside the
// JSON body rather than a multipart upload — simpler to get right than
// hand-rolling multipart parsing, at the cost of this ceiling being lower
// than the image's actual byte size. Capped below Vercel's own hard
// ~4.5MB request-body limit for serverless functions, which isn't
// configurable here and rejects anything over it before this code ever
// runs, with a plain-text "Request Entity Too Large" response rather than
// JSON — the 8mb this used to be set to was already unreachable in
// practice. 4mb of base64 is roughly a 3mb photo.
export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
  },
};

export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    const result = await listIdeas();
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const { title, description, timeline, imageBase64, imageType } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ ok: false, error: 'Title is required' });
    }
    try {
      const idea = await addIdea({ title, description, timeline, imageBase64, imageType });
      return res.status(201).json({ ok: true, idea });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
