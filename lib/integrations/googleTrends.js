// Google Trends has no official API. This talks directly to the same
// internal endpoints the unofficial Python "pytrends" wrapper uses
// (trends.google.com/trends/api/...) rather than shelling out to Python
// from a Next.js app. It's unofficial and Google actively rate-limits/
// blocks bot-like traffic against it, so treat this as best-effort and
// expect it to fail intermittently — that's why every call is wrapped and
// falls back to `unavailable` rather than throwing.
import { fetchText, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; cultural-intelligence-console/1.0)' };

// Both endpoints prefix their JSON body with an anti-hijacking garbage
// string — strip it before parsing.
function parseGuardedJson(text) {
  return JSON.parse(text.replace(/^\)\]\}'?,?\n?/, ''));
}

export async function getSearchInterest() {
  try {
    return await memoize('googleTrends:interest', 60 * 60 * 1000, async () => {
      const exploreReq = {
        comparisonItem: [{ keyword: artistIdentifiers.name, geo: '', time: 'today 3-m' }],
        category: 0,
        property: '',
      };
      const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=0&req=${encodeURIComponent(
        JSON.stringify(exploreReq)
      )}`;
      const exploreText = await fetchText(exploreUrl, { headers: HEADERS });
      const exploreData = parseGuardedJson(exploreText);
      const widget = exploreData.widgets?.find((w) => w.id === 'TIMESERIES');
      if (!widget) throw new Error('no TIMESERIES widget in explore response');

      const widgetUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=0&req=${encodeURIComponent(
        JSON.stringify(widget.request)
      )}&token=${widget.token}`;
      const widgetText = await fetchText(widgetUrl, { headers: HEADERS });
      const widgetData = parseGuardedJson(widgetText);
      const points = (widgetData.default?.timelineData || []).map((p) => ({
        time: p.formattedTime,
        value: p.value?.[0] ?? 0,
      }));
      if (!points.length) throw new Error('empty timeline');
      return live({ keyword: artistIdentifiers.name, points });
    });
  } catch (err) {
    return unavailable(`Google Trends fetch failed: ${err.message}`);
  }
}
