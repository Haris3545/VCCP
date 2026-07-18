import { isAuthedRequestCookie } from '@/lib/auth';
import { getMediaData } from '@/lib/dataSource';

// Backs the top ticker's headline feed - a thin read-only wrapper around
// the same news integration the Media tab uses (see lib/dataSource.js),
// trimmed to just what a marquee needs. Ticker.js fetches this client-side
// since the ticker renders inside AppShell on every page, most of which
// never otherwise touch news data via getStaticProps.
export default async function handler(req, res) {
  if (!isAuthedRequestCookie(req.headers.cookie)) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  const { news } = await getMediaData();

  if (news.source !== 'live') {
    return res.status(200).json({ source: news.source, reason: news.reason });
  }

  const headlines = news.articles.slice(0, 14).map((a) => ({
    headline: a.headline,
    outlet: a.outlet,
    link: a.link,
  }));

  return res.status(200).json({ source: 'live', headlines });
}
