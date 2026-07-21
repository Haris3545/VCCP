// Progressively backfills the news archive (lib/integrations/newsArchive.js)
// with real historical coverage, a few calendar months per day.
//
// The archive on its own only ever grows forward from whichever day the
// daily cron first ran (see pages/api/cron/collect-news.js) - it folds in
// that day's live snapshot, which is itself just "whatever Google News
// currently considers recent." That means month/year-over-year comparisons
// in the Media Trend Index stayed empty for as long as it took real time to
// actually pass, which isn't the "massive backlog, immediately useful"
// archive that was asked for.
//
// Google News RSS search accepts before:/after: as literal date-bounded
// terms inside the query text (the same operators Google Search itself
// supports), so real historical articles - with their real original
// publishedAt dates - are fetchable without an API key, just like the live
// feed already is. Walking backwards a few months at a time and folding
// each month's results into the archive gets two years of real history
// (enough to populate both the "last year" period and its own prior-year
// comparison window, see computeTrendStats) within a handful of days of
// the cron running, rather than the 24 days one-month-per-run would take -
// still just a few sequential requests per run, well inside a serverless
// function's timeout and gentle on Google's endpoint since they land a
// day apart from each other.
import { fetchQuery } from './news';
import { appendArticlesToArchive, hasBlobToken } from './newsArchive';
import { artistIdentifiers } from '../artist.identifiers';
import { put, head, BlobNotFoundError } from '@vercel/blob';

const STATE_PATHNAME = 'news/backfill-state.json';
const TARGET_MONTHS = 24;
const MONTHS_PER_RUN = 4;

async function readState() {
  try {
    const info = await head(STATE_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`backfill state fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof BlobNotFoundError) return { monthsDone: 0 };
    throw err;
  }
}

async function writeState(state) {
  await put(STATE_PATHNAME, JSON.stringify(state), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

// Window for "n months ago": from (n+1) months back to n months back,
// e.g. n=0 covers 1-2 months ago, n=1 covers 2-3 months ago, etc. - starts
// one month in the past rather than at "now" since the live daily
// collection already covers the current month far more thoroughly (four
// query variants, every 30 minutes) than a single backfill pass would.
function monthWindow(n) {
  const now = new Date();
  const after = new Date(now);
  after.setUTCMonth(after.getUTCMonth() - (n + 2));
  const before = new Date(now);
  before.setUTCMonth(before.getUTCMonth() - (n + 1));
  return { after: isoDate(after), before: isoDate(before) };
}

// Called by the daily collection cron, after that run's normal live
// collection. Best-effort by design (see collect-news.js) - a failed or
// skipped step just picks up where it left off (state is only advanced
// past a month once it's actually been fetched) on the next day's run.
export async function runBackfillStep() {
  if (!hasBlobToken()) return { ran: false, reason: 'missing BLOB_READ_WRITE_TOKEN' };

  const state = await readState();
  if (state.monthsDone >= TARGET_MONTHS) {
    return { ran: false, reason: 'backfill already complete', monthsDone: state.monthsDone };
  }

  const name = artistIdentifiers.name;
  let monthsDone = state.monthsDone;
  let added = 0;
  const windows = [];

  while (monthsDone < TARGET_MONTHS && windows.length < MONTHS_PER_RUN) {
    const { after, before } = monthWindow(monthsDone);
    const articles = await fetchQuery(`"${name}" after:${after} before:${before}`).catch(() => []);
    const result = await appendArticlesToArchive(articles);
    added += result.added;
    windows.push({ after, before, found: articles.length });
    monthsDone++;
    await writeState({ monthsDone });
  }

  return { ran: true, windows, monthsDone, targetMonths: TARGET_MONTHS, added };
}
