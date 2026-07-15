// Chartmetric — paid, cross-platform streaming/social/audience data.
// Requires an active subscription and a refresh token from your Chartmetric
// account (Settings > API). This has not been tested against a live
// Chartmetric account (none was available while building it) — verify
// endpoint paths against current Chartmetric docs once you have access.
// Env: CHARTMETRIC_REFRESH_TOKEN
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const BASE = 'https://api.chartmetric.com/api';

function hasCredentials() {
  return Boolean(process.env.CHARTMETRIC_REFRESH_TOKEN);
}

async function getAccessToken() {
  return memoize('chartmetric:token', 55 * 60 * 1000, async () => {
    const res = await fetch(`${BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshtoken: process.env.CHARTMETRIC_REFRESH_TOKEN }),
    });
    if (!res.ok) throw new Error(`Chartmetric token request failed: ${res.status}`);
    const data = await res.json();
    return data.token;
  });
}

async function resolveArtistId(token) {
  return memoize('chartmetric:artistId', 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/search?q=${encodeURIComponent(artistIdentifiers.name)}&type=artists&limit=5`;
    const data = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
    const best = data.obj?.artists?.[0];
    if (!best) throw new Error('no Chartmetric artist match');
    return best.id;
  });
}

export async function getCrossPlatformStats() {
  if (!hasCredentials()) return unavailable('missing CHARTMETRIC_REFRESH_TOKEN (paid tier)');
  try {
    const token = await getAccessToken();
    const artistId = await resolveArtistId(token);
    return await memoize(`chartmetric:stats:${artistId}`, 60 * 60 * 1000, async () => {
      const url = `${BASE}/artist/${artistId}/stat/all`;
      const data = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
      return live({ artistId, stats: data.obj || data });
    });
  } catch (err) {
    return unavailable(`Chartmetric fetch failed: ${err.message}`);
  }
}
