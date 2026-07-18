// Google News RSS — no API key required, so this is the one integration that
// runs "for free" out of the box rather than waiting on a credential the user
// has to go source. Several search queries run in parallel (artist name, the
// new album, new singles/videos) and get merged + de-duplicated into one feed.
// Re-fetched every MEDIA_TTL_MS so the Media tab keeps finding new coverage
// without a human ever re-triggering it — the "agent constantly searching
// the internet" is just this memoized poll, re-primed on each ISR revalidate.
import * as cheerio from 'cheerio';
import { fetchText, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const MEDIA_TTL_MS = 30 * 60 * 1000;
const ARTICLES_PER_QUERY = 20;
const MAX_ARTICLES = 40;

function searchQueries() {
  const name = artistIdentifiers.name;
  return [
    `"${name}"`,
    `"${name}" "Music, Fashion and Film"`,
    `"${name}" (single OR "new song")`,
    `"${name}" ("music video" OR video)`,
  ];
}

function rssUrl(query) {
  const params = new URLSearchParams({ q: query, hl: 'en-US', gl: 'US', ceid: 'US:en' });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

// Google's RSS titles are "Article headline - Outlet Name" — split off the
// outlet from the end rather than trusting the separate <source> tag, which
// isn't always present on every item.
function splitTitle(rawTitle) {
  const idx = rawTitle.lastIndexOf(' - ');
  if (idx === -1) return { headline: rawTitle, outlet: null };
  return { headline: rawTitle.slice(0, idx), outlet: rawTitle.slice(idx + 3) };
}

function cleanSnippet(descriptionHtml) {
  if (!descriptionHtml) return '';
  const $ = cheerio.load(descriptionHtml);
  return $.root().text().replace(/\s+/g, ' ').trim();
}

async function fetchQuery(query) {
  const xml = await fetchText(rssUrl(query), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cultural-intelligence-console/1.0)' },
  });
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];
  $('item')
    .slice(0, ARTICLES_PER_QUERY)
    .each((_, el) => {
      const node = $(el);
      const rawTitle = node.find('title').first().text().trim();
      const link = node.find('link').first().text().trim();
      const pubDate = node.find('pubDate').first().text().trim();
      const sourceTag = node.find('source').first().text().trim();
      if (!rawTitle || !link) return;
      const { headline, outlet } = splitTitle(rawTitle);
      items.push({
        headline,
        outlet: sourceTag || outlet || 'Unknown outlet',
        link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
        snippet: cleanSnippet(node.find('description').first().text()),
      });
    });
  return items;
}

export async function getCoverage() {
  try {
    return await memoize('news:coverage', MEDIA_TTL_MS, async () => {
      const results = await Promise.all(searchQueries().map((q) => fetchQuery(q).catch(() => [])));
      const byLink = new Map();
      for (const item of results.flat()) {
        if (!byLink.has(item.link)) byLink.set(item.link, item);
      }
      const articles = [...byLink.values()]
        .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
        .slice(0, MAX_ARTICLES);

      if (!articles.length) throw new Error('no articles returned for any query');
      return live({ articles });
    });
  } catch (err) {
    return unavailable(`News fetch failed: ${err.message}`);
  }
}
