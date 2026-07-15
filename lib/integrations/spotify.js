// Spotify Web API — catalogue/track metadata. Requires a free app at
// developer.spotify.com. Uses the Client Credentials flow (app-only auth,
// no user login needed for public catalogue data).
// Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

function hasCredentials() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function getToken() {
  return memoize('spotify:token', 50 * 60 * 1000, async () => {
    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);
    const data = await res.json();
    return data.access_token;
  });
}

export async function resolveArtistId() {
  if (artistIdentifiers.spotifyArtistId) return artistIdentifiers.spotifyArtistId;
  if (!hasCredentials()) throw new Error('SPOTIFY_CLIENT_ID/SECRET not configured');
  return memoize('spotify:artistId', 24 * 60 * 60 * 1000, async () => {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      artistIdentifiers.name
    )}&type=artist&limit=5`;
    const data = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
    const best = data.artists?.items?.[0];
    if (!best) throw new Error('no Spotify artist match');
    return best.id;
  });
}

export async function getArtistOverview() {
  if (!hasCredentials()) return unavailable('missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET');
  try {
    const token = await getToken();
    const artistId = await resolveArtistId();
    return await memoize(`spotify:overview:${artistId}`, 30 * 60 * 1000, async () => {
      const [artist, topTracks] = await Promise.all([
        fetchJson(`https://api.spotify.com/v1/artists/${artistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchJson(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      return live({
        artistId,
        followers: artist.followers?.total ?? null,
        popularity: artist.popularity ?? null,
        genres: artist.genres || [],
        imageUrl: artist.images?.[0]?.url || null,
        topTracks: (topTracks.tracks || []).slice(0, 10).map((t) => ({
          id: t.id,
          name: t.name,
          album: t.album?.name,
          popularity: t.popularity,
          previewUrl: t.preview_url,
          releaseDate: t.album?.release_date,
        })),
      });
    });
  } catch (err) {
    return unavailable(`Spotify fetch failed: ${err.message}`);
  }
}
