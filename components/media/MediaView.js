import { useEffect, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';

// Deterministic string hash (djb2) so each article's masthead style, tilt,
// texture pick, and the reveal-open push directions are stable across
// server render and hydration — no Math.random(), which would mismatch.
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
    paper: 'linear-gradient(160deg, #fbf9f2, #efece0)',
    accent: '#a3272c',
    align: 'center',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 700,
    style: 'italic',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #fdf6ee, #f1e6d6)',
    accent: '#5c2a4d',
    align: 'left',
  },
  {
    font: "'Oswald', var(--font-sans)",
    weight: 700,
    style: 'normal',
    tracking: '0.02em',
    paper: 'linear-gradient(160deg, #f6f5ef, #e7e4d8)',
    accent: '#1d3a5f',
    align: 'left',
  },
  {
    font: "'Space Grotesk', var(--font-sans)",
    weight: 700,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f7f8f4, #e9ebe3)',
    accent: '#2f5233',
    align: 'center',
  },
  {
    font: "'IBM Plex Mono', ui-monospace, monospace",
    weight: 600,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f4f6ef, #e5e9dd)',
    accent: '#1f5c56',
    align: 'left',
  },
  {
    font: 'var(--font-display)',
    weight: 400,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #faf3ec, #ecdcd0)',
    accent: '#b5811a',
    align: 'center',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 900,
    style: 'italic',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f9f1ec, #ecdcd2)',
    accent: '#1b1710',
    align: 'left',
  },
];

const SECTION_TAGS = ['MUSIC', 'CULTURE', 'POP', 'STYLE', 'CELEBRITY', 'FILM'];
const FOLD_CORNERS = ['tr', 'br', 'bl'];
const TEXTURE_VARIANTS = ['heavy', 'soft', 'print'];

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
    return <span className="news-strip__masthead-text">{outlet}</span>;
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

function stripStyleVars(article) {
  const masthead = MASTHEAD_STYLES[hashString(article.outlet) % MASTHEAD_STYLES.length];
  const tag = SECTION_TAGS[hashString(`${article.link}tag`) % SECTION_TAGS.length];
  const rot = ((hashString(`${article.link}r`) % 100) / 100 - 0.5) * 4.5;
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
    tag,
    align: masthead.align,
    texVariant,
    fold: hasFold ? foldCorner : null,
  };
}

export default function MediaView({ data }) {
  const news = data?.news;
  const articles = news?.source === 'live' ? news.articles : [];
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    if (openIndex === null) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') setOpenIndex(null);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [openIndex]);

  if (news?.source !== 'live' || articles.length === 0) {
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

  const open = openIndex !== null ? articles[openIndex] : null;

  return (
    <div className="media-newsroom">
      <div className="media-newsroom__head">
        <span className="eyebrow">Live coverage agent</span>
        <span className="media-newsroom__updated">
          Last swept {formatDate(news.fetchedAt)} · {articles.length} clippings
        </span>
      </div>

      <div className={`media-stack${open ? ' media-stack--reading' : ''}`}>
        {articles.map((article, i) => {
          const { vars, tag, align, texVariant, fold } = stripStyleVars(article);
          const delta = i - (openIndex ?? i);
          const pushed = open && i !== openIndex;
          const style = {
            ...vars,
            transitionDelay: pushed ? `${Math.min(Math.abs(delta) * 10, 160)}ms` : undefined,
          };
          return (
            <button
              key={article.link}
              type="button"
              className={`news-strip news-strip--${align}${i === openIndex ? ' news-strip--open' : ''}${
                pushed ? (delta < 0 ? ' news-strip--push-left' : ' news-strip--push-right') : ''
              }`}
              style={style}
              onClick={() => setOpenIndex(i)}
            >
              <span className={`news-strip__texture news-strip__texture--${texVariant}`} aria-hidden="true" />
              <div className="news-strip__band-top">
                <span className="news-strip__tag">{tag}</span>
                <span className="news-strip__band-rule" aria-hidden="true" />
              </div>
              <div className="news-strip__masthead">
                <OutletLogo outlet={article.outlet} domain={article.outletDomain} />
              </div>
              <div className="news-strip__dateline">{formatDate(article.publishedAt)}</div>
              <div className="news-strip__rule-thick" aria-hidden="true" />
              {fold ? <span className={`news-strip__foldcorner news-strip__foldcorner--${fold}`} aria-hidden="true" /> : null}
              <h3 className="news-strip__headline">{article.headline}</h3>
              <div className="news-strip__underline" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {open ? (
        <div className="media-reader" onClick={() => setOpenIndex(null)}>
          <article className="media-reader__sheet" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="media-reader__close"
              onClick={() => setOpenIndex(null)}
              aria-label="Back to clippings"
            >
              ×
            </button>
            <div className="media-article__masthead">
              <span className="media-article__eyebrow">{open.outlet}</span>
              <span className="media-article__date">{formatDate(open.publishedAt)}</span>
            </div>
            <h2 className="media-article__headline">{open.headline}</h2>
            <div className="media-article__rule" aria-hidden="true" />
            <p className="media-article__snippet">
              {open.snippet || 'No preview text was returned for this article — read it in full at the source.'}
            </p>
            <a className="media-article__link" href={open.link} target="_blank" rel="noreferrer">
              Read full article at {open.outlet} →
            </a>
          </article>
        </div>
      ) : null}
    </div>
  );
}
