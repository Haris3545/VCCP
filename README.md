# Charli XCX — Cultural Intelligence Console (Lite)

A client-facing cultural-intelligence / campaign-tracking console built for VCCP Media,
generated from the "Recording Studio" per-artist platform pattern. This is the **Lite** tier:
Dashboard, Audience, and Strategy (SOAP/POAP) tabs, running on simulated "awaiting data"
content with a clean seam to wire in real data sources later.

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
- `lib/dataSource.js` — the data-fetching seam. Every function currently returns mock data from
  `lib/mockData/`; swapping in a real integration (Spotify, GWI, Brand24, GDELT, ...) means
  editing only this file, not the pages/components that consume it.
- `pages/dashboard.js`, `pages/audience.js`, `pages/strategy.js` — the three Lite-tier tabs.
- Strategy edits persist to `localStorage` (per browser, no backend in this tier) and can be
  reset to defaults per-section.

## Not included in this tier

Media/Music/Social/Reddit-YouTube/Tactics/Ideas/Calendar/Locations/Research tabs, live
third-party API integrations, exports, real auth, cross-device sync. See the build plan for the
full "Recording Studio" spec these would follow if/when this grows beyond Lite.

## Deploying

This was built in a sandbox without outbound access to Vercel, so it hasn't been deployed from
here. Push this repo to GitHub and connect it via Vercel's own GitHub integration, or run
`vercel` locally once you have the CLI authenticated.
