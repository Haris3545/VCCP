// Kworb.net has no API — this scrapes its public Spotify streaming-numbers
// table. No auth, but fragile: it breaks if Kworb changes its markup, and
// scraping is a ToS grey area, so treat this as best-effort and expect it
// to need occasional repair. Keyed by Spotify artist ID (reuses the ID
// resolved by spotify.js when Spotify credentials are configured, or a
// manually pinned CHARLI_SPOTIFY_ARTIST_ID).
import * as cheerio from 'cheerio';
import { fetchText, memoize, live, unavailable } from './http';
import { resolveArtistId } from './spotify';
import { artistIdentifiers } from '../artist.identifiers';

// Generic sortable-table scraper: first row is treated as the header, every
// other row becomes an object keyed by header text. Resilient to column
// reordering; breaks only if Kworb changes the table's id/class entirely.
function parseTable(html) {
  const $ = cheerio.load(html);
  const table = $('table.sortable').first();
  if (!table.length) throw new Error('expected table.sortable not found on Kworb page');

  const headers = table
    .find('tr')
    .first()
    .find('th')
    .map((_, el) => $(el).text().trim())
    .get();

  return table
    .find('tr')
    .slice(1)
    .map((_, row) => {
      const cells = $(row)
        .find('td')
        .map((__, cell) => $(cell).text().trim())
        .get();
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? null]));
    })
    .get();
}

async function resolveSpotifyId() {
  if (artistIdentifiers.spotifyArtistId) return artistIdentifiers.spotifyArtistId;
  return resolveArtistId();
}

export async function getStreamingNumbers() {
  try {
    const spotifyId = await resolveSpotifyId();
    return await memoize(`kworb:songs:${spotifyId}`, 60 * 60 * 1000, async () => {
      const url = `https://kworb.net/spotify/artist/${spotifyId}_songs.html`;
      const html = await fetchText(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cultural-intelligence-console/1.0)' },
      });
      const rows = parseTable(html);
      return live({ spotifyId, tracks: rows.slice(0, 50) });
    });
  } catch (err) {
    return unavailable(`Kworb fetch failed: ${err.message}`);
  }
}
