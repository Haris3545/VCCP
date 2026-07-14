// Single per-artist config surface. Re-skinning this console for a different
// artist means editing this file only — nothing else should hardcode identity
// or brand colours.
const artistConfig = {
  artistId: 'charli-xcx',
  artistName: 'Charli XCX',
  wordmark: 'CHARLI XCX',
  loginPassword: process.env.ARTIST_LOGIN_PASSWORD || 'bratgreen2026',

  theme: {
    accent: '#8ACE00',
    accentDeep: '#5C8F00',
    bg: '#0b0b0b',
    surface: '#151515',
    paper: '#f4f2ea',
    muted: '#8a8a86',
    grainOpacity: 0.07,
  },

  tabs: ['dashboard', 'audience', 'strategy'],

  meta: {
    title: 'Charli XCX — Cultural Intelligence',
    description: 'VCCP Media cultural-intelligence console for Charli XCX.',
  },
};

export default artistConfig;
