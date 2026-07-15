// MusicBrainz — keyless discography/release data. Requires a descriptive
// User-Agent per MusicBrainz's usage policy and a max of ~1 req/sec, which
// the module-level cache naturally respects for our use case.
// Docs: https://musicbrainz.org/doc/MusicBrainz_API
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';
import { STUDIO_NAME } from '../constants';

const BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = `${STUDIO_NAME.replace(/\s+/g, '')}/1.0 ( ${process.env.MUSICBRAINZ_CONTACT || 'no-contact-configured@example.com'} )`;

function headers() {
  return { 'User-Agent': USER_AGENT, Accept: 'application/json' };
}

async function resolveMbid() {
  if (artistIdentifiers.musicbrainzMbid) return artistIdentifiers.musicbrainzMbid;
  return memoize('musicbrainz:mbid', 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/artist/?query=${encodeURIComponent(`artist:"${artistIdentifiers.name}"`)}&fmt=json&limit=5`;
    const data = await fetchJson(url, { headers: headers() });
    const best = data.artists?.[0];
    if (!best) throw new Error('no MusicBrainz artist match');
    return best.id;
  });
}

export async function getDiscography() {
  try {
    const mbid = await resolveMbid();
    return await memoize(`musicbrainz:discography:${mbid}`, 60 * 60 * 1000, async () => {
      const url = `${BASE}/release-group?artist=${mbid}&type=album|single|ep&fmt=json&limit=100`;
      const data = await fetchJson(url, { headers: headers() });
      const releaseGroups = (data['release-groups'] || [])
        .map((rg) => ({
          id: rg.id,
          title: rg.title,
          primaryType: rg['primary-type'],
          secondaryTypes: rg['secondary-types'] || [],
          firstReleaseDate: rg['first-release-date'] || null,
        }))
        .sort((a, b) => (b.firstReleaseDate || '').localeCompare(a.firstReleaseDate || ''));
      return live({ mbid, releaseGroups, releaseCount: releaseGroups.length });
    });
  } catch (err) {
    return unavailable(`MusicBrainz fetch failed: ${err.message}`);
  }
}
