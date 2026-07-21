import { getCoverage } from '@/lib/integrations/news';
import { appendArticlesToArchive, hasBlobToken } from '@/lib/integrations/newsArchive';

// Runs once a day (see vercel.json's crons entry) to fold the current live
// coverage snapshot into the persistent archive (lib/integrations/
// newsArchive.js), one day's worth of new articles at a time - the archive
// is what lets the Media Trend Index's month/year comparisons mean
// something, since the live feed alone only ever holds the last ~40
// recent articles and Google News RSS has no "give me articles from a
// year ago" mode.
//
// Vercel Cron requests carry this header automatically; a manually-supplied
// secret (via `Authorization: Bearer <CRON_SECRET>` or `?secret=`) is also
// accepted so the endpoint can be triggered/tested without waiting for the
// schedule. Without CRON_SECRET set, only real Vercel Cron requests work.
function isAuthorized(req) {
  if (req.headers['x-vercel-cron']) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query.secret;
  return provided === secret;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  if (!hasBlobToken()) {
    return res.status(200).json({ ok: false, error: 'missing BLOB_READ_WRITE_TOKEN, archive not updated' });
  }

  const coverage = await getCoverage();
  if (coverage.source !== 'live') {
    return res.status(200).json({ ok: false, error: coverage.reason });
  }

  try {
    const result = await appendArticlesToArchive(coverage.articles);

    // Best-effort - the archive write already succeeded, so a revalidation
    // hiccup here shouldn't turn into a failure response. Without this the
    // new totals would still show up, just after the normal 30-minute ISR
    // window instead of immediately.
    try {
      await res.revalidate('/media');
      await res.revalidate('/media-2');
    } catch {
      // ignore — next ISR revalidation window will pick it up regardless
    }

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
