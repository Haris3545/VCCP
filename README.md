# Charli XCX — Cultural Intelligence Console (Lite)

A client-facing cultural-intelligence / campaign-tracking console built for VCCP Media,
generated from the "Recording Studio" per-artist platform pattern. This is the **Lite** tier:
Dashboard, Audience, Music, YouTube, Social listening, and Strategy (SOAP/POAP) tabs. Music,
YouTube, and Social listening pull real data once you add API keys (see "Connecting live data
sources" below); everything else still runs on simulated "awaiting data" content with a clean
seam to wire in later.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

**Default password:** `bratgreen2026` (set via `ARTIST_LOGIN_PASSWORD` env var — see
`lib/artist.config.js`). Not real authentication; it's a shared-password gate matching the
reference product's UX, not a security boundary.

## Structure

- `lib/artist.config.js` — all per-artist branding (name, wordmark, password, theme colours,
  enabled tabs). This is the single file to edit to re-skin the console for a different artist.
- `lib/constants.js` — the fixed agency kicker ("VCCP Media Cultural Intelligence"). Deliberately
  kept out of `artist.config.js` so it can never be accidentally rebranded per artist.
- `lib/dataSource.js` — the data-fetching seam. Dashboard/Music/YouTube/Social listening call out
  to `lib/integrations/*` for live data and fall back to mock data (or a per-section "Not
  connected" state) when a source isn't configured. Audience and Strategy still return mock data
  only — no requested API source maps to those tabs.
- `lib/integrations/` — one module per external API (see below), each self-contained: resolves
  the artist's ID on that platform, fetches, normalizes, and never throws — callers always get
  back `{ source: 'live', ... }` or `{ source: 'unavailable', reason }`.
- `lib/artist.identifiers.js` — cross-platform artist IDs. Left blank by default so each
  integration resolves its own ID via search; set the `CHARLI_*_ID` env vars here only if
  auto-resolution ever picks the wrong entity.
- `pages/dashboard.js`, `pages/music.js`, `pages/youtube.js`, `pages/social-listening.js`,
  `pages/audience.js`, `pages/strategy.js` — the Lite-tier tabs. The first four use
  `revalidate: 3600` (ISR) so live data refreshes hourly once deployed.
- Strategy edits persist to `localStorage` (per browser, no backend in this tier) and can be
  reset to defaults per-section.

## Connecting live data sources

Copy `.env.example` to `.env.local` and fill in whichever API keys you have — each source is
independent, so partial coverage is fine. What's wired up per tab:

| Tab | Sources | Auth |
| --- | --- | --- |
| Dashboard | Google Trends (Search Interest KPI only) | none |
| Music | Spotify, MusicBrainz, Wikidata, Discogs, Kworb, Genius, Setlist.fm | mixed (see below) |
| YouTube | YouTube Data API | key |
| Social listening | Reddit | OAuth app |

- **No key needed:** MusicBrainz, Wikidata SPARQL, Kworb (HTML scrape), Google Trends (unofficial
  internal endpoints — the same ones the Python `pytrends` wrapper uses, reimplemented directly
  in JS). The scrape/unofficial sources are inherently fragile: Kworb breaks if their markup
  changes, Google Trends is bot-detected and rate-limited unpredictably. Both fail closed to
  "unavailable" rather than crashing the page.
- **Free, self-serve signup:** Spotify (`SPOTIFY_CLIENT_ID`/`SECRET`, client-credentials flow),
  YouTube (`YOUTUBE_API_KEY`), Genius (`GENIUS_ACCESS_TOKEN` — metadata/annotation counts only;
  Genius's terms don't allow serving lyric text through third-party apps), Setlist.fm
  (`SETLISTFM_API_KEY`), Discogs (`DISCOGS_TOKEN`), Reddit (`REDDIT_CLIENT_ID`/`SECRET`,
  read-only script app).
- **Paid, requires an active subscription:** Chartmetric (`CHARTMETRIC_REFRESH_TOKEN`) and
  Soundcharts (`SOUNDCHARTS_APP_ID`/`SOUNDCHARTS_API_KEY`) modules exist in
  `lib/integrations/` but aren't wired into any page yet — neither was tested against a live
  account, so verify endpoint paths against current docs before trusting the output.
- **Deliberately not attempted:** Songkick (partner-approval only) and Bandsintown (API closed to
  new developers) — Setlist.fm covers tour/setlist history instead.

## Not included in this tier

Media/Tactics/Ideas/Calendar/Locations/Research tabs, exports, real auth, cross-device sync,
Chartmetric/Soundcharts wired into a page. See the build plan for the full "Recording Studio"
spec these would follow if/when this grows beyond Lite.

## Deploying

This was built in a sandbox without outbound access to Vercel, so it hasn't been deployed from
here. Push this repo to GitHub and connect it via Vercel's own GitHub integration, or run
`vercel` locally once you have the CLI authenticated.
