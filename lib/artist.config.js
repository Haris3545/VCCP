// Single per-artist config surface. Re-skinning this console for a different
// artist means editing this file only — nothing else should hardcode identity
// or brand colours.
const artistConfig = {
  artistId: 'charli-xcx',
  artistName: 'Charli XCX',
  wordmark: 'CHARLI XCX',
  loginPassword: process.env.ARTIST_LOGIN_PASSWORD || 'charli2026',

  theme: {
    // General UI accent — off-white grey. Green/red are reserved for
    // upward/downward trend indicators only (see --trend-up in globals.css).
    accent: '#D4D2D2',
    accentDeep: '#B5B3B3',
    bg: '#0b0b0b',
    surface: '#151515',
    paper: '#f4f2ea',
    muted: '#8a8a86',
    grainOpacity: 0.07,
  },

  tabs: [
    'dashboard',
    'media',
    'social-listening',
    'music',
    'youtube',
    'audience',
    'strategy',
    'tactics',
    'locations',
    'ideas',
    'calendar',
    'research',
  ],

  meta: {
    title: 'Charli XCX — Cultural Intelligence',
    description: 'VCCP Media cultural-intelligence console for Charli XCX.',
  },
};

export default artistConfig;
