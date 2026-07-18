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

// Google's own RSS rarely carries an image, but the underlying item can
// still include one via the standard media: namespace or a stray <img>
// inside the HTML description — worth checking both before giving up, since
// the newspaper UI shows a real photo swatch only when one genuinely exists
// rather than ever fabricating one.
function extractImage($, node, descriptionHtml) {
  const media = node.find('media\\:content, media\\:thumbnail, enclosure').first();
  const mediaUrl = media.attr('url');
  if (mediaUrl) return mediaUrl;
  if (descriptionHtml) {
    const $desc = cheerio.load(descriptionHtml);
    const imgSrc = $desc('img').first().attr('src');
    if (imgSrc) return imgSrc;
  }
  return null;
}

// Google's RSS almost never carries an image of its own, so for articles
// that came back without one this makes a second, lightweight pass: fetch
// the article's actual page and pull whatever photo it's using for social
// previews (og:image / twitter:image) - the real "pile of photos the
// articles are using" rather than a fabricated stand-in. Capped concurrency
// and a short per-request timeout so one slow/unreachable publisher can't
// hold up the whole refresh; any failure just leaves imageUrl null, same as
// an article that genuinely has no photo.
const IMAGE_FETCH_CONCURRENCY = 10;
const IMAGE_FETCH_TIMEOUT_MS = 4500;

async function fetchOgImage(url) {
  try {
    const html = await fetchText(url, {
      timeoutMs: IMAGE_FETCH_TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cultural-intelligence-console/1.0)' },
    });
    const $ = cheerio.load(html);
    const og =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="og:image:url"]').attr('content');
    return og || null;
  } catch {
    return null;
  }
}

async function fillMissingImages(articles) {
  const queue = articles.filter((a) => !a.imageUrl);
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const article = queue[cursor];
      cursor += 1;
      article.imageUrl = await fetchOgImage(article.link);
    }
  }
  await Promise.all(Array.from({ length: IMAGE_FETCH_CONCURRENCY }, worker));
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
      const descriptionHtml = node.find('description').first().text();
      if (!rawTitle || !link) return;
      const { headline, outlet } = splitTitle(rawTitle);
      items.push({
        headline,
        outlet: sourceTag || outlet || 'Unknown outlet',
        link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
        snippet: cleanSnippet(descriptionHtml),
        imageUrl: extractImage($, node, descriptionHtml),
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
      await fillMissingImages(articles);
      return live({ articles });
    });
  } catch (err) {
    return unavailable(`News fetch failed: ${err.message}`);
  }
}
