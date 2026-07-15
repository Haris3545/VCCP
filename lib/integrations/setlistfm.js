// Setlist.fm — tour/setlist history. Free API key from api.setlist.fm.
// Setlist.fm identifies artists by MusicBrainz MBID, so this reuses the
// MBID resolved by musicbrainz.js instead of doing its own artist search.
// Env: SETLISTFM_API_KEY
import { fetchJson, memoize, live, unavailable } from './http';
import { getDiscography } from './musicbrainz';

const BASE = 'https://api.setlist.fm/rest/1.0';

function hasCredentials() {
  return Boolean(process.env.SETLISTFM_API_KEY);
}

function authHeaders() {
  return { 'x-api-key': process.env.SETLISTFM_API_KEY, Accept: 'application/json' };
}

export async function getRecentSetlists() {
  if (!hasCredentials()) return unavailable('missing SETLISTFM_API_KEY');
  try {
    const discography = await getDiscography();
    const mbid = discography.mbid;
    if (!mbid) throw new Error('no MusicBrainz MBID available to look up setlists');

    return await memoize(`setlistfm:setlists:${mbid}`, 30 * 60 * 1000, async () => {
      const url = `${BASE}/artist/${mbid}/setlists?p=1`;
      const data = await fetchJson(url, { headers: authHeaders() });
      const setlists = (data.setlist || []).slice(0, 15).map((s) => ({
        id: s.id,
        eventDate: s.eventDate,
        venue: s.venue?.name,
        city: s.venue?.city?.name,
        country: s.venue?.city?.country?.name,
        tour: s.tour?.name || null,
        songCount: (s.sets?.set || []).reduce((sum, set) => sum + (set.song?.length || 0), 0),
        url: s.url,
      }));
      return live({ setlists });
    });
  } catch (err) {
    return unavailable(`Setlist.fm fetch failed: ${err.message}`);
  }
}
