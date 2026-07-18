import { useEffect, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';

// Deterministic string hash (djb2) so each article's tilt/jitter and each
// outlet's masthead style are stable across server render and hydration —
// no Math.random(), which would mismatch between the two.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

// A handful of distinct "masthead personalities" built entirely from fonts
// already bundled locally (no per-outlet real branding to fetch) — each
// outlet name deterministically hashes to one, so the same outlet always
// reads the same way and different outlets read visibly differently, the
// way a real stack of newspapers has different mastheads.
const MASTHEAD_STYLES = [
  {
    font: 'var(--font-serif)',
    weight: 900,
    style: 'normal',
    transform: 'uppercase',
    tracking: '-0.01em',
    paper: 'linear-gradient(160deg, #fbf9f2, #efece0)',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 700,
    style: 'italic',
    transform: 'none',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #fdf6ee, #f1e6d6)',
  },
  {
    font: "'Oswald', var(--font-sans)",
    weight: 700,
    style: 'normal',
    transform: 'uppercase',
    tracking: '0.015em',
    paper: 'linear-gradient(160deg, #f6f5ef, #e7e4d8)',
  },
  {
    font: "'Space Grotesk', var(--font-sans)",
    weight: 700,
    style: 'normal',
    transform: 'none',
    tracking: '-0.01em',
    paper: 'linear-gradient(160deg, #f7f8f4, #e9ebe3)',
  },
  {
    font: "'IBM Plex Mono', ui-monospace, monospace",
    weight: 600,
    style: 'normal',
    transform: 'uppercase',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f4f6ef, #e5e9dd)',
  },
  {
    font: 'var(--font-display)',
    weight: 400,
    style: 'normal',
    transform: 'uppercase',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #faf3ec, #ecdcd0)',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 900,
    style: 'italic',
    transform: 'none',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f9f1ec, #ecdcd2)',
  },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function clippingStyleVars(article) {
  const masthead = MASTHEAD_STYLES[hashString(article.outlet) % MASTHEAD_STYLES.length];
  const rot = ((hashString(article.link) % 100) / 100 - 0.5) * 7;
  const jx = ((hashString(`${article.link}x`) % 100) / 100 - 0.5) * 10;
  const jy = ((hashString(`${article.link}y`) % 100) / 100 - 0.5) * 14;
  return {
    '--rot': `${rot.toFixed(2)}deg`,
    '--jx': `${jx.toFixed(1)}px`,
    '--jy': `${jy.toFixed(1)}px`,
    '--paper-bg': masthead.paper,
    '--headline-font': masthead.font,
    '--headline-weight': masthead.weight,
    '--headline-style': masthead.style,
    '--headline-transform': masthead.transform,
    '--headline-tracking': masthead.tracking,
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
          const delta = i - (openIndex ?? i);
          const pushed = open && i !== openIndex;
          const pushDir = delta === 0 ? 0 : delta > 0 ? 1 : -1;
          const style = {
            ...clippingStyleVars(article),
            ...(pushed
              ? {
                  '--push-x': `${pushDir * (70 + Math.abs(delta) * 16)}px`,
                  '--push-y': `${(i % 2 === 0 ? -1 : 1) * (30 + Math.abs(delta) * 6)}px`,
                  '--push-rot': `${pushDir * (10 + Math.abs(delta) * 2)}deg`,
                  transitionDelay: `${Math.min(Math.abs(delta) * 12, 180)}ms`,
                }
              : {}),
          };
          return (
            <button
              key={article.link}
              type="button"
              className={`news-clipping${i === openIndex ? ' news-clipping--open' : ''}${pushed ? ' news-clipping--pushed' : ''}`}
              style={style}
              onClick={() => setOpenIndex(i)}
            >
              <span className="news-clipping__outlet">{article.outlet}</span>
              <span className="news-clipping__headline">{article.headline}</span>
              <span className="news-clipping__date">{formatDate(article.publishedAt)}</span>
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
