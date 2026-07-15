// Genius API — song/annotation metadata. Free client access token from
// genius.com/api-clients. Note: Genius's API terms prohibit serving actual
// lyric text through third-party apps, so this fetches song metadata and
// annotation counts only, not lyric bodies — link out to the Genius page
// for lyrics.
// Env: GENIUS_ACCESS_TOKEN
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const BASE = 'https://api.genius.com';

function hasCredentials() {
  return Boolean(process.env.GENIUS_ACCESS_TOKEN);
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN}` };
}

async function resolveArtistId() {
  if (artistIdentifiers.geniusArtistId) return artistIdentifiers.geniusArtistId;
  return memoize('genius:artistId', 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/search?q=${encodeURIComponent(artistIdentifiers.name)}`;
    const data = await fetchJson(url, { headers: authHeaders() });
    const hit = data.response?.hits?.find((h) => h.result?.primary_artist)?.result;
    if (!hit) throw new Error('no Genius search hit');
    return hit.primary_artist.id;
  });
}

export async function getTopSongs() {
  if (!hasCredentials()) return unavailable('missing GENIUS_ACCESS_TOKEN');
  try {
    const artistId = await resolveArtistId();
    return await memoize(`genius:songs:${artistId}`, 60 * 60 * 1000, async () => {
      const url = `${BASE}/artists/${artistId}/songs?sort=popularity&per_page=20`;
      const data = await fetchJson(url, { headers: authHeaders() });
      const songs = (data.response?.songs || []).map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        releaseDate: s.release_date_for_display || null,
        annotationCount: s.annotation_count ?? null,
        pageViews: s.stats?.pageviews ?? null,
        thumbnailUrl: s.song_art_image_thumbnail_url || null,
      }));
      return live({ artistId, songs });
    });
  } catch (err) {
    return unavailable(`Genius fetch failed: ${err.message}`);
  }
}
