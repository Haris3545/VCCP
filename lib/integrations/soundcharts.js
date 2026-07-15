// Soundcharts — paid, cross-platform streaming/social/audience data.
// Requires an active subscription (app ID + API key from your Soundcharts
// account). This has not been tested against a live Soundcharts account
// (none was available while building it), and Soundcharts versions its API
// per-resource (v2, v2.9, ...) — verify endpoint paths/versions against
// current Soundcharts docs once you have access.
// Env: SOUNDCHARTS_APP_ID, SOUNDCHARTS_API_KEY
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const BASE = 'https://customer.api.soundcharts.com';

function hasCredentials() {
  return Boolean(process.env.SOUNDCHARTS_APP_ID && process.env.SOUNDCHARTS_API_KEY);
}

function authHeaders() {
  return {
    'x-app-id': process.env.SOUNDCHARTS_APP_ID,
    'x-api-key': process.env.SOUNDCHARTS_API_KEY,
  };
}

async function resolveArtistUuid() {
  return memoize('soundcharts:artistUuid', 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/api/v2/artist/search/${encodeURIComponent(artistIdentifiers.name)}`;
    const data = await fetchJson(url, { headers: authHeaders() });
    const best = data.items?.[0];
    if (!best) throw new Error('no Soundcharts artist match');
    return best.uuid;
  });
}

export async function getAudienceStats() {
  if (!hasCredentials()) {
    return unavailable('missing SOUNDCHARTS_APP_ID / SOUNDCHARTS_API_KEY (paid tier)');
  }
  try {
    const uuid = await resolveArtistUuid();
    return await memoize(`soundcharts:stats:${uuid}`, 60 * 60 * 1000, async () => {
      const url = `${BASE}/api/v2.9/artist/${uuid}`;
      const data = await fetchJson(url, { headers: authHeaders() });
      return live({ uuid, artist: data.object || data });
    });
  } catch (err) {
    return unavailable(`Soundcharts fetch failed: ${err.message}`);
  }
}
