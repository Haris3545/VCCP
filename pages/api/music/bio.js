import { isAuthedRequestCookie } from '@/lib/auth';
import { getReleaseBio } from '@/lib/integrations/wikipedia';
import { artistIdentifiers } from '@/lib/artist.identifiers';

// Backs the discography shelf's "open the case up" bio panel
// (components/music/DiscographyShelf.js) - fetched client-side, on demand,
// only for whichever single release the listener actually opens, rather
// than resolving a Wikipedia page for the entire discography up front.
// Most singles and lesser releases genuinely have no dedicated page; that
// surfaces as a normal `unavailable` result, not a 500.
export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ source: 'unavailable', reason: 'Not authenticated' });
  }

  const { title, type } = req.query;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ source: 'unavailable', reason: 'missing title' });
  }

  const bio = await getReleaseBio(title, artistIdentifiers.name, typeof type === 'string' ? type : '');
  return res.status(200).json(bio);
}
