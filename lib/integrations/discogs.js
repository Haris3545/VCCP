// Discogs API — release/pressing detail. Free personal access token from
// discogs.com/settings/developers.
// Env: DISCOGS_TOKEN
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';
import { STUDIO_NAME } from '../constants';

const BASE = 'https://api.discogs.com';
const USER_AGENT = `${STUDIO_NAME.replace(/\s+/g, '')}/1.0`;

function hasCredentials() {
  return Boolean(process.env.DISCOGS_TOKEN);
}

function authHeaders() {
  return { 'User-Agent': USER_AGENT, Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}` };
}

async function resolveArtistId() {
  if (artistIdentifiers.discogsArtistId) return artistIdentifiers.discogsArtistId;
  return memoize('discogs:artistId', 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/database/search?q=${encodeURIComponent(
      artistIdentifiers.name
    )}&type=artist`;
    const data = await fetchJson(url, { headers: authHeaders() });
    const best = data.results?.[0];
    if (!best) throw new Error('no Discogs artist match');
    return best.id;
  });
}

export async function getReleases() {
  if (!hasCredentials()) return unavailable('missing DISCOGS_TOKEN');
  try {
    const artistId = await resolveArtistId();
    return await memoize(`discogs:releases:${artistId}`, 60 * 60 * 1000, async () => {
      const url = `${BASE}/artists/${artistId}/releases?sort=year&sort_order=desc&per_page=50`;
      const data = await fetchJson(url, { headers: authHeaders() });
      const releases = (data.releases || []).map((r) => ({
        id: r.id,
        title: r.title,
        year: r.year || null,
        format: r.format || null,
        role: r.role,
        thumb: r.thumb || null,
      }));
      return live({ artistId, releases });
    });
  } catch (err) {
    return unavailable(`Discogs fetch failed: ${err.message}`);
  }
}
