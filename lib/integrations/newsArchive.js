// A persistent, ever-growing archive of coverage articles, separate from
// news.js's own 30-minute live snapshot. Google News RSS only ever returns
// recent results - there's no way to ask it for "everything from a year
// ago" - so month/year-over-year comparison needs its own accumulating
// history, built up one collection run at a time (see
// pages/api/cron/collect-news.js) rather than fetched fresh each time.
//
// Same lightweight "JSON blob as a database" approach as lib/ideas/store.js
// (see its own comment for the full reasoning and history) - a single JSON
// array in Vercel Blob storage, read-modify-written on each append. Fine
// for a once-a-day writer; not a pattern for frequent/concurrent writes.
import { put, head, BlobNotFoundError } from '@vercel/blob';

const ARCHIVE_PATHNAME = 'news/archive.json';

// A generous ceiling so the archive comfortably covers real year-over-year
// comparison (see lib/media/trend.js) without growing without bound if this
// runs for several years - a safety net, not a tuned-to-the-day limit.
const MAX_ARCHIVE_SIZE = 20000;

export function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readArchive() {
  try {
    const info = await head(ARCHIVE_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`archive fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof BlobNotFoundError) return [];
    throw err;
  }
}

async function writeArchive(articles) {
  await put(ARCHIVE_PATHNAME, JSON.stringify(articles), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

// Read-only accessor for the pages that fold the archive into the live
// feed for trend comparisons (see getMediaData in lib/dataSource.js).
// Degrades to an empty archive rather than throwing whenever the archive
// isn't reachable yet (no token configured, nothing collected yet, or a
// transient read failure) - month/year comparisons just fall back to
// whatever the live snapshot alone can show, the same as before this
// existed.
export async function getArchivedArticles() {
  if (!hasBlobToken()) return [];
  try {
    return await readArchive();
  } catch {
    return [];
  }
}

// Called by the daily collection cron - merges newly-fetched live articles
// into the persistent archive, deduped by link (the same key news.js
// already dedupes live results by).
export async function appendArticlesToArchive(newArticles) {
  if (!hasBlobToken()) throw new Error('missing BLOB_READ_WRITE_TOKEN');

  const existing = await readArchive();
  const byLink = new Map(existing.map((a) => [a.link, a]));
  let added = 0;
  for (const article of newArticles) {
    if (!byLink.has(article.link)) {
      byLink.set(article.link, article);
      added++;
    }
  }
  const merged = [...byLink.values()]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, MAX_ARCHIVE_SIZE);

  await writeArchive(merged);
  return { added, total: merged.length };
}
