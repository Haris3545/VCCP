// Wikipedia — keyless, no API token required (same "runs for free" category
// as Google News and MusicBrainz). Used for the discography shelf's "open
// the case up" bio panel (components/music/DiscographyShelf.js).
//
// A release title alone is too ambiguous to fetch directly ("Crash" is
// also a film, a Ballard novel, a car-safety term...) so this is a
// two-step lookup like Discogs/MusicBrainz's own artist resolution: search
// for the best-matching page scoped to the artist and "album", then fetch
// that exact page's summary. Most singles and lesser releases won't have
// their own Wikipedia page at all - that's a normal, expected outcome
// (unavailable), not an error to retry.
import { fetchJson, memoize, live, unavailable } from './http';
import { STUDIO_NAME } from '../constants';

const SEARCH_URL = 'https://en.wikipedia.org/w/api.php';
const SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';

function headers() {
  return {
    'User-Agent': `${STUDIO_NAME.replace(/\s+/g, '')}/1.0 (${process.env.WIKIPEDIA_CONTACT || 'no-contact-configured@example.com'})`,
    Accept: 'application/json',
  };
}

async function searchPageTitle(query) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '1',
    format: 'json',
    origin: '*',
  });
  const data = await fetchJson(`${SEARCH_URL}?${params.toString()}`, { headers: headers() });
  const hit = data.query?.search?.[0];
  if (!hit) throw new Error('no Wikipedia search match');
  return hit.title;
}

export async function getReleaseBio(releaseTitle, artistName) {
  try {
    return await memoize(`wikipedia:bio:${artistName}:${releaseTitle}`, 24 * 60 * 60 * 1000, async () => {
      const pageTitle = await searchPageTitle(`${releaseTitle} ${artistName} album`);
      const url = `${SUMMARY_BASE}/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
      const data = await fetchJson(url, { headers: headers() });
      if (data.type === 'disambiguation') throw new Error('resolved to a disambiguation page');
      if (!data.extract) throw new Error('no summary text available');
      return live({
        title: data.title,
        extract: data.extract,
        pageUrl: data.content_urls?.desktop?.page || null,
      });
    });
  } catch (err) {
    return unavailable(`Wikipedia fetch failed: ${err.message}`);
  }
}
