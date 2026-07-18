// Shared between the two Media views (the newspaper-styled MediaView and
// the flatter, pill-based Media2View) - both read the same underlying
// article feed and need the same category/tone derivation and formatting,
// just present it completely differently. Kept here once rather than
// copy-pasted so the two views can never quietly drift out of sync on
// what "positive" or "music" actually means.

// Deterministic string hash (djb2) so any per-article visual variation is
// stable across server render and hydration — no Math.random(), which
// would mismatch between the two.
export function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

// Category is derived from real keyword matches in the headline/snippet
// (checked in this order — first match wins) rather than assigned at
// random, so the filter tabs actually mean something. "Culture" is the
// fallback bucket for anything that doesn't match a more specific one.
export const CATEGORIES = [
  { id: 'all', label: 'All news' },
  { id: 'music', label: 'Music' },
  { id: 'film', label: 'Film' },
  { id: 'style', label: 'Style' },
  { id: 'celebrity', label: 'Celebrity' },
  { id: 'culture', label: 'Culture' },
];
const CATEGORY_KEYWORDS = {
  music: ['song', 'album', 'single', 'track', 'music', 'tour', 'concert', 'setlist', 'record', 'lyric'],
  film: ['film', 'movie', 'video', 'trailer', 'documentary', 'short film', 'premiere'],
  style: ['fashion', 'style', 'outfit', 'dress', 'runway', 'wardrobe', 'beauty', 'look'],
  celebrity: ['dating', 'romance', 'relationship', 'wedding', 'engaged', 'boyfriend', 'girlfriend', 'feud', 'split'],
};
export function deriveCategory(article) {
  const text = `${article.headline} ${article.snippet || ''}`.toLowerCase();
  for (const cat of ['music', 'film', 'style', 'celebrity']) {
    if (CATEGORY_KEYWORDS[cat].some((kw) => text.includes(kw))) return cat;
  }
  return 'culture';
}

// A deliberately simple keyword lexicon, not a real sentiment model - and
// deliberately conservative about what counts as positive: a headline that
// merely reports something happening ("announces", "reveals", "shares") is
// neutral, not positive, however exciting the news is. Only an actual
// evaluative/praise adjective in the headline earns "positive". Sarcasm
// obviously can't be reliably detected by keyword matching, but a few
// common tells (a trailing "...", a deflating "uh"/"um" aside) at least
// catch the driest cases without over-claiming what this heuristic can do.
const POSITIVE_WORDS = [
  'favourite', 'favorite', 'best', 'iconic', 'beloved', 'stunning', 'triumphant', 'acclaimed', 'brilliant',
  'dazzling', 'glowing', 'adored', 'masterpiece', 'flawless', 'breathtaking', 'triumph',
];
const NEGATIVE_WORDS = [
  'flop', 'criticiz', 'critici', 'backlash', 'slam', 'feud', 'controvers', 'cancel', 'disappoint', 'fail', 'mock',
  'blast', 'boo', 'trouble', 'clash', 'accus',
];
const SARCASM_CUES = [', uh,', ' uh,', ', um,', ' um,', '...', ' huh?', 'lol'];
export function scoreTone(article) {
  const text = `${article.headline} ${article.snippet || ''}`.toLowerCase();
  const pos = POSITIVE_WORDS.some((w) => text.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => text.includes(w)) || SARCASM_CUES.some((c) => text.includes(c));
  if (neg) return 'negative';
  if (pos) return 'positive';
  return 'neutral';
}

export const PERIODS = [
  { id: 'week', label: 'Last week', days: 7 },
  { id: 'month', label: 'Last month', days: 30 },
  { id: 'year', label: 'Last year', days: 365 },
];

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// Some feeds give the outlet's display name as its bare domain (e.g.
// "billboard.com" instead of "Billboard") - strip a trailing .com so the
// nameplate reads as a publication name rather than a URL.
export function cleanOutletName(outlet) {
  return outlet.replace(/\.com$/i, '');
}
