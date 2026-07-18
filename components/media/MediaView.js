import { useMemo, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';

// Deterministic string hash (djb2) so each article's masthead style, tilt,
// and texture pick are stable across server render and hydration — no
// Math.random(), which would mismatch between the two.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

// A handful of distinct "masthead personalities" built entirely from fonts
// already bundled locally — each outlet name deterministically hashes to
// one, so the same outlet always reads the same way and different outlets
// read visibly differently, the way a real stack of front pages has
// different mastheads, rules, ink and layout conventions (some broadsheets
// centre everything, tabloids run left-aligned and bolder).
const MASTHEAD_STYLES = [
  {
    font: 'var(--font-serif)',
    weight: 900,
    style: 'normal',
    tracking: '0.01em',
    paper: 'linear-gradient(160deg, #efe9d8, #e3dcc4)',
    accent: '#a3272c',
    align: 'center',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 700,
    style: 'italic',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f0e6d4, #e6d8bd)',
    accent: '#5c2a4d',
    align: 'left',
  },
  {
    font: "'Oswald', var(--font-sans)",
    weight: 700,
    style: 'normal',
    tracking: '0.02em',
    paper: 'linear-gradient(160deg, #ece7d9, #dfd9c2)',
    accent: '#1d3a5f',
    align: 'left',
  },
  {
    font: "'Space Grotesk', var(--font-sans)",
    weight: 700,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #edeadb, #e0ddc5)',
    accent: '#2f5233',
    align: 'center',
  },
  {
    font: "'IBM Plex Mono', ui-monospace, monospace",
    weight: 600,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #eee6d2, #e2d6b8)',
    accent: '#1f5c56',
    align: 'left',
  },
  {
    font: 'var(--font-display)',
    weight: 400,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #efe3d0, #e4d3b5)',
    accent: '#b5811a',
    align: 'center',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 900,
    style: 'italic',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #ebe6da, #ddd7c3)',
    accent: '#1b1710',
    align: 'left',
  },
];

const FOLD_CORNERS = ['tr', 'br', 'bl'];
const TEXTURE_VARIANTS = ['heavy', 'soft', 'print'];

// Category is derived from real keyword matches in the headline/snippet
// (checked in this order — first match wins) rather than assigned at
// random, so the filter tabs below actually mean something. "Culture" is
// the fallback bucket for anything that doesn't match a more specific one.
const CATEGORIES = [
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
function deriveCategory(article) {
  const text = `${article.headline} ${article.snippet || ''}`.toLowerCase();
  for (const cat of ['music', 'film', 'style', 'celebrity']) {
    if (CATEGORY_KEYWORDS[cat].some((kw) => text.includes(kw))) return cat;
  }
  return 'culture';
}

// A deliberately simple keyword lexicon, not a real sentiment model — good
// enough to give an honest, illustrative tone signal over real headline
// text without pretending to be more sophisticated than it is.
const POSITIVE_WORDS = [
  'hit', 'triumph', 'best', 'love', 'stun', 'iconic', 'win', 'celebrat', 'praise', 'glowing', 'success', 'adore',
  'dazzl', 'soar', 'acclaim', 'brilliant', 'joy', 'excit', 'return', 'surprise',
];
const NEGATIVE_WORDS = [
  'flop', 'criticiz', 'critici', 'backlash', 'slam', 'feud', 'controvers', 'cancel', 'disappoint', 'fail', 'mock',
  'blast', 'boo', 'trouble', 'split', 'clash', 'accus',
];
function scoreTone(article) {
  const text = `${article.headline} ${article.snippet || ''}`.toLowerCase();
  const pos = POSITIVE_WORDS.some((w) => text.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => text.includes(w));
  if (pos && !neg) return 'positive';
  if (neg && !pos) return 'negative';
  return 'neutral';
}

const PERIODS = [
  { id: 'week', label: 'Last week', days: 7 },
  { id: 'month', label: 'Last month', days: 30 },
  { id: 'year', label: 'Last year', days: 365 },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// Best-effort fallback when the RSS feed didn't give us the outlet's real
// domain (see lib/integrations/news.js's <source url> extraction) — a
// plain slug guess, not a lookup of anything real, so the logo may simply
// fail to load for less common outlets (OutletLogo falls back to text).
function guessDomain(outlet) {
  return `${outlet
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '')}.com`;
}

// Shows the outlet's actual logo, sourced live from their own domain via
// Clearbit's keyless logo API (not a hand-reproduced trademark) — falls
// back to the plain outlet name if the logo can't be found/loaded.
function OutletLogo({ outlet, domain }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="news-strip__masthead-text ink-text">{outlet}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="news-strip__logo-img"
      src={`https://logo.clearbit.com/${domain || guessDomain(outlet)}?size=300`}
      alt={outlet}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function stripStyleVars(article, isTop) {
  const masthead = MASTHEAD_STYLES[hashString(article.outlet) % MASTHEAD_STYLES.length];
  // The top sheet in the pile sits almost flat - it's the one "currently on
  // top," so only the strips underneath it lean at the fuller tilt range.
  const rot = isTop
    ? ((hashString(`${article.link}r`) % 100) / 100 - 0.5) * 1.2
    : ((hashString(`${article.link}r`) % 100) / 100 - 0.5) * 4.5;
  const texX = hashString(`${article.link}tx`) % 100;
  const texY = hashString(`${article.link}ty`) % 100;
  const texOpacity = 0.3 + ((hashString(`${article.link}to`) % 100) / 100) * 0.35;
  const texVariant = TEXTURE_VARIANTS[hashString(`${article.link}tv`) % TEXTURE_VARIANTS.length];
  const hasFold = hashString(`${article.link}fold`) % 100 < 45;
  const foldCorner = FOLD_CORNERS[hashString(`${article.link}foldc`) % FOLD_CORNERS.length];
  return {
    vars: {
      '--paper-bg': masthead.paper,
      '--accent': masthead.accent,
      '--masthead-font': masthead.font,
      '--masthead-weight': masthead.weight,
      '--masthead-style': masthead.style,
      '--masthead-tracking': masthead.tracking,
      '--rot': `${rot.toFixed(2)}deg`,
      '--tex-x': `${texX}%`,
      '--tex-y': `${texY}%`,
      '--tex-opacity': texOpacity.toFixed(2),
    },
    align: masthead.align,
    texVariant,
    fold: hasFold ? foldCorner : null,
  };
}

function MediaTrendIndex({ articles }) {
  const [period, setPeriod] = useState('week');
  const stats = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period).days;
    const now = Date.now();
    const withDates = articles.filter((a) => a.publishedAt);
    const current = withDates.filter((a) => now - new Date(a.publishedAt).getTime() < days * 86400000);
    const prior = withDates.filter((a) => {
      const age = now - new Date(a.publishedAt).getTime();
      return age >= days * 86400000 && age < days * 2 * 86400000;
    });
    const pctChange = prior.length ? Math.round(((current.length - prior.length) / prior.length) * 100) : null;

    const toned = current.map(scoreTone);
    const posCount = toned.filter((t) => t === 'positive').length;
    const negCount = toned.filter((t) => t === 'negative').length;
    const scored = posCount + negCount;
    const posPct = scored ? Math.round((posCount / scored) * 100) : null;

    return { currentCount: current.length, priorCount: prior.length, pctChange, posPct, negPct: posPct === null ? null : 100 - posPct };
  }, [articles, period]);

  return (
    <div className="media-trend card">
      <div className="card__head">
        <div>
          <div className="eyebrow">Coverage volume</div>
          <h2 style={{ marginTop: 4 }}>Media Trend Index</h2>
        </div>
        <SourceBadge source="live" />
      </div>

      <div className="media-trend__body">
        <div className="media-trend__stat">
          <span className={`media-trend__pct${stats.pctChange > 0 ? ' media-trend__pct--up' : stats.pctChange < 0 ? ' media-trend__pct--down' : ''}`}>
            {stats.pctChange === null ? '—' : `${stats.pctChange > 0 ? '+' : ''}${stats.pctChange}%`}
          </span>
          <span className="media-trend__stat-label">
            {stats.currentCount} article{stats.currentCount === 1 ? '' : 's'}
            {stats.priorCount
              ? ` vs ${stats.priorCount} the ${PERIODS.find((p) => p.id === period).label.toLowerCase().replace('last ', 'previous ')}`
              : ' — not enough earlier coverage in this feed to compare yet'}
          </span>
        </div>

        <div className="pill-toggle">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pill-toggle__btn${period === p.id ? ' pill-toggle__btn--active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {stats.posPct !== null ? (
        <div className="media-trend__tone">
          <div className="media-trend__tone-bar">
            <span className="media-trend__tone-fill media-trend__tone-fill--pos" style={{ width: `${stats.posPct}%` }} />
            <span className="media-trend__tone-fill media-trend__tone-fill--neg" style={{ width: `${stats.negPct}%` }} />
          </div>
          <span className="media-trend__tone-label">
            {stats.posPct}% positive tone · {stats.negPct}% negative tone (headline keyword heuristic, not a sentiment model)
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function MediaView({ data }) {
  const news = data?.news;
  const allArticles = news?.source === 'live' ? news.articles : [];
  const [openLink, setOpenLink] = useState(null);
  const [category, setCategory] = useState('all');

  const categorized = useMemo(() => allArticles.map((a) => ({ ...a, category: deriveCategory(a) })), [allArticles]);
  const articles = category === 'all' ? categorized : categorized.filter((a) => a.category === category);

  if (news?.source !== 'live' || allArticles.length === 0) {
    return (
      <div className="card">
        <div className="card__head">
          <div>
            <div className="eyebrow">Google News</div>
            <h2 style={{ marginTop: 4 }}>Coverage feed</h2>
          </div>
          <SourceBadge source={news?.source} />
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 560 }}>
          {news?.reason || 'No coverage found yet — check back shortly.'}
        </p>
      </div>
    );
  }

  return (
    <div className="media-newsroom">
      {/* Ink-bleed filters shared by every headline/nameplate on the page -
          feDisplacementMap distorts the crisp vector text edges using
          turbulence noise, so type reads as printed rather than perfectly
          even, the same technique used in the broadsheet print study. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="mediaInkBleed" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="9" result="fiber" />
            <feDisplacementMap in="SourceGraphic" in2="fiber" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="bled" />
            <feGaussianBlur in="bled" stdDeviation="0.22" />
          </filter>
          <filter id="mediaInkBleedHeavy" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="17" result="fiber2" />
            <feDisplacementMap in="SourceGraphic" in2="fiber2" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="bled2" />
            <feGaussianBlur in="bled2" stdDeviation="0.24" />
          </filter>
        </defs>
      </svg>

      <MediaTrendIndex articles={categorized} />

      <div className="media-newsroom__head">
        <span className="eyebrow">Live coverage agent</span>
        <span className="media-newsroom__updated">
          Last swept {formatDate(news.fetchedAt)} · {allArticles.length} clippings
        </span>
      </div>

      <div className="pill-toggle pill-toggle--categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`pill-toggle__btn${category === c.id ? ' pill-toggle__btn--active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="media-stack">
        {articles.map((article, i) => {
          const isOpen = article.link === openLink;
          const { vars, align, texVariant, fold } = stripStyleVars(article, i === 0);
          const tagLabel = CATEGORIES.find((c) => c.id === article.category)?.label.toUpperCase() || 'CULTURE';

          if (isOpen) {
            return (
              <article key={article.link} className={`news-strip news-strip--${align} news-strip--open`} style={vars}>
                <span className={`news-strip__texture news-strip__texture--${texVariant}`} aria-hidden="true" />
                <button type="button" className="news-strip__collapse" onClick={() => setOpenLink(null)} aria-label="Collapse article">
                  <div className="news-strip__top">
                    <div className="news-strip__masthead">
                      <OutletLogo outlet={article.outlet} domain={article.outletDomain} />
                    </div>
                    <div className="news-strip__meta">
                      <span className="news-strip__tag">{tagLabel}</span>
                      <span className="news-strip__date">{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                  <div className="news-strip__rule-thick" aria-hidden="true" />
                </button>
                <h2 className="news-strip__headline news-strip__headline--open ink-text--heavy">{article.headline}</h2>
                <div className="media-article__rule" aria-hidden="true" />
                <p className="news-strip__snippet">
                  {article.snippet || 'No preview text was returned for this article — read it in full at the source.'}
                </p>
                <a className="news-strip__link" href={article.link} target="_blank" rel="noreferrer">
                  Read full article at {article.outlet} →
                </a>
              </article>
            );
          }

          return (
            <button
              key={article.link}
              type="button"
              className={`news-strip news-strip--${align}`}
              style={vars}
              onClick={() => setOpenLink(article.link)}
            >
              <span className={`news-strip__texture news-strip__texture--${texVariant}`} aria-hidden="true" />
              <div className="news-strip__top">
                <div className="news-strip__masthead">
                  <OutletLogo outlet={article.outlet} domain={article.outletDomain} />
                </div>
                <div className="news-strip__meta">
                  <span className="news-strip__tag">{tagLabel}</span>
                  <span className="news-strip__date">{formatDate(article.publishedAt)}</span>
                </div>
              </div>
              <div className="news-strip__rule-thick" aria-hidden="true" />
              {fold ? <span className={`news-strip__foldcorner news-strip__foldcorner--${fold}`} aria-hidden="true" /> : null}
              <h3 className="news-strip__headline ink-text--heavy">{article.headline}</h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}
