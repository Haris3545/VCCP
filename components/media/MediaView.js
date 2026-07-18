import { useEffect, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';

// Deterministic string hash (djb2) so each article's masthead style/section
// tag and the reveal-open push directions are stable across server render
// and hydration — no Math.random(), which would mismatch between the two.
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
// way a real stack of front pages has different mastheads, rules and ink.
const MASTHEAD_STYLES = [
  {
    font: 'var(--font-serif)',
    weight: 900,
    style: 'normal',
    transform: 'uppercase',
    tracking: '-0.01em',
    paper: 'linear-gradient(160deg, #fbf9f2, #efece0)',
    accent: '#a3272c',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 700,
    style: 'italic',
    transform: 'none',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #fdf6ee, #f1e6d6)',
    accent: '#5c2a4d',
  },
  {
    font: "'Oswald', var(--font-sans)",
    weight: 700,
    style: 'normal',
    transform: 'uppercase',
    tracking: '0.015em',
    paper: 'linear-gradient(160deg, #f6f5ef, #e7e4d8)',
    accent: '#1d3a5f',
  },
  {
    font: "'Space Grotesk', var(--font-sans)",
    weight: 700,
    style: 'normal',
    transform: 'none',
    tracking: '-0.01em',
    paper: 'linear-gradient(160deg, #f7f8f4, #e9ebe3)',
    accent: '#2f5233',
  },
  {
    font: "'IBM Plex Mono', ui-monospace, monospace",
    weight: 600,
    style: 'normal',
    transform: 'uppercase',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f4f6ef, #e5e9dd)',
    accent: '#1f5c56',
  },
  {
    font: 'var(--font-display)',
    weight: 400,
    style: 'normal',
    transform: 'uppercase',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #faf3ec, #ecdcd0)',
    accent: '#b5811a',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 900,
    style: 'italic',
    transform: 'none',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f9f1ec, #ecdcd2)',
    accent: '#1b1710',
  },
];

const SECTION_TAGS = ['MUSIC', 'CULTURE', 'POP', 'STYLE', 'CELEBRITY', 'FILM'];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function stripStyleVars(article) {
  const masthead = MASTHEAD_STYLES[hashString(article.outlet) % MASTHEAD_STYLES.length];
  const tag = SECTION_TAGS[hashString(`${article.link}tag`) % SECTION_TAGS.length];
  return {
    vars: {
      '--paper-bg': masthead.paper,
      '--accent': masthead.accent,
      '--headline-font': masthead.font,
      '--headline-weight': masthead.weight,
      '--headline-style': masthead.style,
      '--headline-transform': masthead.transform,
      '--headline-tracking': masthead.tracking,
    },
    tag,
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
          const { vars, tag } = stripStyleVars(article);
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
              className={`news-strip${i === openIndex ? ' news-strip--open' : ''}${
                pushed ? (delta < 0 ? ' news-strip--push-left' : ' news-strip--push-right') : ''
              }`}
              style={style}
              onClick={() => setOpenIndex(i)}
            >
              <div className="news-strip__top">
                <span className="news-strip__tag">{tag}</span>
                <span className="news-strip__outlet">{article.outlet}</span>
                <span className="news-strip__date">{formatDate(article.publishedAt)}</span>
              </div>
              <div className="news-strip__rule" aria-hidden="true" />
              <div className="news-strip__body">
                <h3 className="news-strip__headline">{article.headline}</h3>
                {article.imageUrl ? (
                  <div className="news-strip__photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.imageUrl} alt="" loading="lazy" />
                    <span className="news-strip__photo-expand" aria-hidden="true">
                      ⤢
                    </span>
                  </div>
                ) : null}
              </div>
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
            {open.imageUrl ? (
              <div className="media-reader__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={open.imageUrl} alt="" />
              </div>
            ) : null}
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
