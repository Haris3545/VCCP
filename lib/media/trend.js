// Computed server-side (see getMediaData in lib/dataSource.js) from the
// live feed merged with the persistent archive (lib/integrations/
// newsArchive.js), rather than client-side from whatever's rendered on the
// page. Two reasons: the archive can grow into the thousands of records
// over time, and shipping that much raw article text to the client just to
// derive a handful of numbers from it client-side would work directly
// against the "keep the page fast" goal the archive itself was built to
// stay out of the way of. Pre-computing every period here means the page
// only ever ships the small resulting numbers, and switching between
// week/month/year client-side (see MediaTrendIndex) is an instant lookup
// rather than a recomputation.
import { PERIODS, scoreTone } from './helpers';

export function computeTrendStats(articles) {
  const now = Date.now();
  const withDates = articles.filter((a) => a.publishedAt);
  const stats = {};

  for (const period of PERIODS) {
    const days = period.days;
    const current = withDates.filter((a) => now - new Date(a.publishedAt).getTime() < days * 86400000);
    const prior = withDates.filter((a) => {
      const age = now - new Date(a.publishedAt).getTime();
      return age >= days * 86400000 && age < days * 2 * 86400000;
    });
    const pctChange = prior.length ? Math.round(((current.length - prior.length) / prior.length) * 100) : null;

    const toned = current.map(scoreTone);
    const total = toned.length;
    const posCount = toned.filter((t) => t === 'positive').length;
    const negCount = toned.filter((t) => t === 'negative').length;
    const neutralCount = total - posCount - negCount;

    stats[period.id] = {
      currentCount: current.length,
      priorCount: prior.length,
      pctChange,
      posPct: total ? Math.round((posCount / total) * 100) : null,
      negPct: total ? Math.round((negCount / total) * 100) : null,
      neutralPct: total ? Math.round((neutralCount / total) * 100) : null,
    };
  }

  return stats;
}
