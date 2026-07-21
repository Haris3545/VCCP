// The data-fetching seam. Each getter tries the relevant live integrations
// in parallel, and only overrides the simulated mock data with a live value
// where a real 1:1 mapping exists — everything else stays honestly labelled
// 'simulated' rather than being backed into from unrelated signals.
import { dashboardMock } from './mockData/dashboard';
import { audienceMock } from './mockData/audience';
import { strategyDefaultsMock } from './mockData/strategy.defaults';

import { getSearchInterest } from './integrations/googleTrends';
import { getArtistOverview as getSpotifyOverview } from './integrations/spotify';
import { getChannelOverview as getYoutubeOverview } from './integrations/youtube';
import { getDiscography as getMusicbrainzDiscography } from './integrations/musicbrainz';
import { getFacts as getWikidataFacts } from './integrations/wikidata';
import { getReleases as getDiscogsReleases } from './integrations/discogs';
import { getStreamingNumbers as getKworbStreams } from './integrations/kworb';
import { getTopSongs as getGeniusSongs } from './integrations/genius';
import { getRecentSetlists } from './integrations/setlistfm';
import { getFanDiscourse as getRedditDiscourse } from './integrations/reddit';
import { getCoverage as getNewsCoverage } from './integrations/news';
import { getArchivedArticles } from './integrations/newsArchive';
import { computeTrendStats } from './media/trend';

export async function getDashboardData() {
  const trends = await getSearchInterest();

  let kpis = dashboardMock.kpis;
  if (trends.source === 'live' && trends.points.length >= 2) {
    const recent = trends.points.slice(-12);
    const last = recent[recent.length - 1].value;
    const prev = recent[recent.length - 2].value;
    const delta = prev === 0 ? 0 : Number((((last - prev) / prev) * 100).toFixed(1));
    kpis = dashboardMock.kpis.map((kpi) =>
      kpi.id === 'search-interest'
        ? {
            ...kpi,
            value: last,
            delta,
            series: recent.map((p, i) => ({ i, v: p.value })),
            source: 'live',
          }
        : kpi
    );
  }

  return { ...dashboardMock, kpis };
}

export async function getAudienceData() {
  return audienceMock;
}

export async function getStrategyDefaults() {
  return strategyDefaultsMock;
}

export async function getMusicData() {
  const [spotify, discography, facts, discogs, streams, songs, setlists] = await Promise.all([
    getSpotifyOverview(),
    getMusicbrainzDiscography(),
    getWikidataFacts(),
    getDiscogsReleases(),
    getKworbStreams(),
    getGeniusSongs(),
    getRecentSetlists(),
  ]);

  return { spotify, discography, facts, discogs, streams, songs, setlists };
}

export async function getYoutubeData() {
  const overview = await getYoutubeOverview();
  return { overview };
}

export async function getSocialListeningData() {
  const discourse = await getRedditDiscourse();
  return { discourse };
}

export async function getMediaData() {
  const news = await getNewsCoverage();

  // The rendered feed (news.articles) stays just the live ~40-article
  // snapshot - the archive exists to make month/year comparisons
  // meaningful, not to bloat the article list itself (see the archive's
  // own comment). Merged and deduped by link since the live snapshot's
  // articles are also folded into the archive daily (see the collection
  // cron) and would otherwise be double-counted.
  const archived = await getArchivedArticles();
  const liveArticles = news.source === 'live' ? news.articles : [];
  const byLink = new Map(archived.map((a) => [a.link, a]));
  for (const article of liveArticles) byLink.set(article.link, article);
  const trendStats = computeTrendStats([...byLink.values()]);

  return { news, trendStats };
}
