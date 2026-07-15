// Google Trends has no official API. This talks directly to the same
// internal endpoints the unofficial Python "pytrends" wrapper uses
// (trends.google.com/trends/api/...) rather than shelling out to Python
// from a Next.js app. It's unofficial and Google actively rate-limits/
// blocks bot-like traffic against it, so treat this as best-effort and
// expect it to fail intermittently — that's why every call is wrapped and
// falls back to `unavailable` rather than throwing.
import { fetchText, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const USER_AGENT = 'Mozilla/5.0 (compatible; cultural-intelligence-console/1.0)';

// Both endpoints prefix their JSON body with an anti-hijacking garbage
// string — strip it before parsing.
function parseGuardedJson(text) {
  return JSON.parse(text.replace(/^\)\]\}'?,?\n?/, ''));
}

// Google Trends bot-gates the API endpoints with no session cookie present.
// pytrends works around this with GetGoogleCookie() — a plain GET to the
// trends homepage to pick up the NID cookie — before calling explore/
// multiline. Skipping this step is why the explore call reliably came back
// empty/blocked; fetch() has no cookie jar, so it has to be forwarded
// manually onto every subsequent request.
async function getSessionCookie() {
  const res = await fetch('https://trends.google.com/?geo=US', {
    headers: { 'User-Agent': USER_AGENT },
  });
  const cookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : (res.headers.get('set-cookie') || '').split(/,(?=[^;]+?=)/).filter(Boolean);
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

export async function getSearchInterest() {
  try {
    return await memoize('googleTrends:interest', 60 * 60 * 1000, async () => {
      const cookie = await getSessionCookie();
      const headers = { 'User-Agent': USER_AGENT, ...(cookie ? { Cookie: cookie } : {}) };

      const exploreReq = {
        comparisonItem: [{ keyword: artistIdentifiers.name, geo: '', time: 'today 3-m' }],
        category: 0,
        property: '',
      };
      const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=0&req=${encodeURIComponent(
        JSON.stringify(exploreReq)
      )}`;
      const exploreText = await fetchText(exploreUrl, { headers });
      const exploreData = parseGuardedJson(exploreText);
      const widget = exploreData.widgets?.find((w) => w.id === 'TIMESERIES');
      if (!widget) throw new Error('no TIMESERIES widget in explore response');

      const widgetUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=0&req=${encodeURIComponent(
        JSON.stringify(widget.request)
      )}&token=${widget.token}`;
      const widgetText = await fetchText(widgetUrl, { headers });
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
