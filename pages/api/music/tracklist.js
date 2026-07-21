import { isAuthedRequestCookie } from '@/lib/auth';
import { getReleaseGroupTracklist } from '@/lib/integrations/musicbrainz';

// Backs the discography shelf's "back of the CD" tracklist panel
// (components/music/DiscographyShelf.js) - fetched client-side, on
// demand, only for whichever single release the listener flips over,
// rather than resolving a tracklist for the whole discography up front
// (each one is its own extra MusicBrainz round trip - see
// getReleaseGroupTracklist's own comment on why it's a release-group + a
// representative release, not one direct lookup).
export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ source: 'unavailable', reason: 'Not authenticated' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ source: 'unavailable', reason: 'missing id' });
  }

  const tracklist = await getReleaseGroupTracklist(id);
  return res.status(200).json(tracklist);
}
