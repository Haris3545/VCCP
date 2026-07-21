import { useMemo, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';
import PillToggle from '@/components/ui/PillToggle';
import { hashString, CATEGORIES, deriveCategory, PERIODS, formatDate, cleanOutletName } from '@/lib/media/helpers';

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
    bodyFont: "Georgia, 'Times New Roman', serif",
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 700,
    style: 'italic',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #f0e6d4, #e6d8bd)',
    accent: '#5c2a4d',
    align: 'left',
    bodyFont: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  },
  {
    font: "'Oswald', var(--font-sans)",
    weight: 700,
    style: 'normal',
    tracking: '0.02em',
    paper: 'linear-gradient(160deg, #ece7d9, #dfd9c2)',
    accent: '#1d3a5f',
    align: 'left',
    bodyFont: 'var(--font-sans)',
  },
  {
    font: "'Space Grotesk', var(--font-sans)",
    weight: 700,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #edeadb, #e0ddc5)',
    accent: '#2f5233',
    align: 'center',
    bodyFont: "'Segoe UI', var(--font-sans)",
  },
  {
    font: "'IBM Plex Mono', ui-monospace, monospace",
    weight: 600,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #eee6d2, #e2d6b8)',
    accent: '#1f5c56',
    align: 'left',
    bodyFont: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
  },
  {
    font: 'var(--font-display)',
    weight: 400,
    style: 'normal',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #efe3d0, #e4d3b5)',
    accent: '#b5811a',
    align: 'center',
    bodyFont: 'Georgia, serif',
  },
  {
    font: "'Playfair Display', var(--font-serif)",
    weight: 900,
    style: 'italic',
    tracking: '0em',
    paper: 'linear-gradient(160deg, #ebe6da, #ddd7c3)',
    accent: '#1b1710',
    align: 'left',
    bodyFont: "'Times New Roman', Cambria, serif",
  },
];

const FOLD_CORNERS = ['tr', 'br', 'bl'];
const TEXTURE_VARIANTS = ['heavy', 'soft', 'print'];
// The current heaviest setting is treated as the ceiling - every variant
// sits at or a little under it, so bleed varies article to article without
// any of them exceeding what was already dialed in as the max.
const INK_BLEED_HEAVY_VARIANTS = ['mediaInkBleedHeavy0', 'mediaInkBleedHeavy1', 'mediaInkBleedHeavy2', 'mediaInkBleedHeavy3'];

// This used to try fetching the outlet's real logo image (logo.dev, then
// Clearbit's older endpoint as a fallback) before dropping to plain text
// if neither loaded. Reverted: against a real, varied set of outlets, too
// many of those fetched assets were square icon/monogram marks rather
// than wordmarks - a solid-colour app-icon-style badge doesn't read as a
// nameplate at standalone size no matter how it's cropped or scaled - and
// at least one asset loaded successfully (no error to even catch) but was
// visibly blank. Plain styled text has looked consistently good all
// session, so that's what stays rather than chasing a fetch that keeps
// misfiring on real-world logos.
function OutletLogo({ outlet }) {
  return <span className="news-strip__masthead-text ink-text">{cleanOutletName(outlet)}</span>;
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
  // Was 0.22-0.48 - the crumple photo was overpowering the print above it
  // at the top of that range, so both ends came down while keeping the
  // same per-article spread between strips.
  const texOpacity = 0.1 + ((hashString(`${article.link}to`) % 100) / 100) * 0.13;
  const texVariant = TEXTURE_VARIANTS[hashString(`${article.link}tv`) % TEXTURE_VARIANTS.length];
  const hasFold = hashString(`${article.link}fold`) % 100 < 45;
  const foldCorner = FOLD_CORNERS[hashString(`${article.link}foldc`) % FOLD_CORNERS.length];
  const inkBleedFilter = INK_BLEED_HEAVY_VARIANTS[hashString(`${article.link}ink`) % INK_BLEED_HEAVY_VARIANTS.length];
  return {
    vars: {
      '--paper-bg': masthead.paper,
      '--accent': masthead.accent,
      '--masthead-font': masthead.font,
      '--masthead-weight': masthead.weight,
      '--masthead-style': masthead.style,
      '--masthead-tracking': masthead.tracking,
      '--body-font': masthead.bodyFont,
      '--ink-filter': `url(#${inkBleedFilter})`,
      '--rot': `${rot.toFixed(2)}deg`,
      '--tex-x': `${texX}%`,
      '--tex-y': `${texY}%`,
      '--tex-opacity': texOpacity.toFixed(2),
    },
    align: masthead.align,
    texVariant,
    fold: hasFold ? foldCorner : null,
    inkBleedFilter,
  };
}

// trendStats is precomputed server-side (see computeTrendStats in
// lib/media/trend.js) from the full archive, not just whatever's rendered
// on the page - one entry per PERIODS id. Switching the toggle below is
// just a lookup into that object, not a recomputation, and the client
// never has to receive (or process) the raw archive to get real
// month/year comparisons out of it.
export function MediaTrendIndex({ trendStats }) {
  const [period, setPeriod] = useState('week');
  const stats = trendStats[period];

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
              : ' — not enough earlier coverage archived to compare yet'}
          </span>
        </div>

        <PillToggle options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {stats.posPct !== null ? (
        <div className="media-trend__tone">
          <div className="media-trend__tone-bar">
            <span className="media-trend__tone-fill media-trend__tone-fill--pos" style={{ width: `${stats.posPct}%` }} />
            <span className="media-trend__tone-fill media-trend__tone-fill--neutral" style={{ width: `${stats.neutralPct}%` }} />
            <span className="media-trend__tone-fill media-trend__tone-fill--neg" style={{ width: `${stats.negPct}%` }} />
          </div>
          <span className="media-trend__tone-label">
            {stats.posPct}% positive · {stats.neutralPct}% neutral · {stats.negPct}% negative tone
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
  const articles = useMemo(
    () => (category === 'all' ? categorized : categorized.filter((a) => a.category === category)),
    [categorized, category]
  );
  // stripStyleVars runs several hashString calls per article (masthead,
  // rotation, texture x/y/opacity/variant, fold, ink-bleed variant) - pure
  // per-article work that only actually needs redoing when the article
  // list or category filter changes. Without this memo it was recomputing
  // all of it for every article, every render - including the render
  // triggered by opening or closing a single strip (openLink toggling),
  // which is exactly the moment that recompute work competes with the
  // open/close animation for the main thread.
  const styleVarsByLink = useMemo(() => {
    const map = new Map();
    articles.forEach((article, i) => map.set(article.link, stripStyleVars(article, i === 0)));
    return map;
  }, [articles]);

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
          even, the same technique used in the broadsheet print study.
          feTurbulence/feDisplacementMap are genuinely expensive - CPU-bound
          per-pixel work, not GPU-accelerated - and the filter region below
          (x/y/width/height) is what actually sets how many pixels each one
          has to run that work over. It's a percentage of the filtered
          element's own box, so it used to scale up right along with it:
          a 25% margin was never about needing that much room (the actual
          displacement here maxes out around 1-1.5px, scale/2, plus a
          fraction of a px of blur spread) but the wider this page's
          headlines get on a big screen, the more wasted pixels that
          percentage was over-computing turbulence for. A few-percent
          margin gives the same couple of px of real headroom the effect
          actually needs at any element size, without the cost scaling up
          with how wide the newspaper column itself has gotten. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="mediaInkBleed" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="9" result="fiber" />
            <feDisplacementMap in="SourceGraphic" in2="fiber" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="bled" />
            <feGaussianBlur in="bled" stdDeviation="0.22" />
          </filter>
          {/* Four headline-bleed variants, all at or just under the same
              ceiling (scale 2.6 was the previous fixed "heavy" setting) so
              every headline reads as heavily bled but no two look
              identical - picked per article via --ink-filter. */}
          <filter id="mediaInkBleedHeavy0" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="17" result="fiber2" />
            <feDisplacementMap in="SourceGraphic" in2="fiber2" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="bled2" />
            <feGaussianBlur in="bled2" stdDeviation="0.24" />
          </filter>
          <filter id="mediaInkBleedHeavy1" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="22" result="fiber3" />
            <feDisplacementMap in="SourceGraphic" in2="fiber3" scale="2.35" xChannelSelector="R" yChannelSelector="G" result="bled3" />
            <feGaussianBlur in="bled3" stdDeviation="0.22" />
          </filter>
          <filter id="mediaInkBleedHeavy2" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.48" numOctaves="2" seed="31" result="fiber4" />
            <feDisplacementMap in="SourceGraphic" in2="fiber4" scale="2.55" xChannelSelector="R" yChannelSelector="G" result="bled4" />
            <feGaussianBlur in="bled4" stdDeviation="0.25" />
          </filter>
          <filter id="mediaInkBleedHeavy3" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.58" numOctaves="2" seed="40" result="fiber5" />
            <feDisplacementMap in="SourceGraphic" in2="fiber5" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="bled5" />
            <feGaussianBlur in="bled5" stdDeviation="0.2" />
          </filter>
        </defs>
      </svg>

      <MediaTrendIndex trendStats={data.trendStats} />

      <div className="media-newsroom__head">
        <span className="eyebrow">Live coverage agent</span>
        <span className="media-newsroom__updated">
          Last swept {formatDate(news.fetchedAt)} · {allArticles.length} clippings
        </span>
      </div>

      <PillToggle options={CATEGORIES} value={category} onChange={setCategory} className="pill-toggle--categories" />

      <div className="media-stack">
        {articles.map((article, i) => {
          const isOpen = article.link === openLink;
          const isLast = i === articles.length - 1;
          const { vars, align, texVariant, fold } = styleVarsByLink.get(article.link);
          const tagLabel = CATEGORIES.find((c) => c.id === article.category)?.label.toUpperCase() || 'CULTURE';
          const outletName = cleanOutletName(article.outlet);

          // One persistent element for both states (rather than swapping
          // between a <button> and an <article> depending on isOpen) - that
          // swap used to make React unmount/remount a brand new DOM node on
          // every toggle, so the transform/box-shadow transitions declared
          // in CSS never actually had a "from" state to animate out of and
          // the strip just snapped open instantly. With one node, the lift
          // genuinely tweens, and the headline/snippet reveal below is
          // driven by a CSS grid-template-rows accordion (0fr/1fr), which is
          // the one reliable way to smoothly animate to/from an
          // auto-height block without JS measuring it up front.
          return (
            <article
              key={article.link}
              className={`news-strip news-strip--${align}${isOpen ? ' news-strip--open' : ''}${isLast ? ' news-strip--torn' : ''}`}
              // Staggered per the strip's position in the pile, capped so a
              // long feed doesn't leave the last few cards waiting on an
              // ever-growing delay - each one settles in shortly after the
              // one above it rather than the whole stack materialising at
              // once, which is what actually reads as "loading in"
              // gracefully rather than a static page that was just always
              // there.
              style={{ ...vars, '--stagger-delay': `${Math.min(i * 45, 480)}ms` }}
              onClick={isOpen ? undefined : () => setOpenLink(article.link)}
              onKeyDown={
                isOpen
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenLink(article.link);
                      }
                    }
              }
              role={isOpen ? undefined : 'button'}
              tabIndex={isOpen ? undefined : 0}
            >
              <span className={`news-strip__texture news-strip__texture--${texVariant}`} aria-hidden="true" />
              {isOpen ? (
                <button type="button" className="news-strip__collapse" onClick={() => setOpenLink(null)} aria-label="Collapse article">
                  <div className="news-strip__top">
                    <div className="news-strip__masthead">
                      <OutletLogo outlet={article.outlet} />
                    </div>
                    <div className="news-strip__meta">
                      <span className="news-strip__tag">{tagLabel}</span>
                      <span className="news-strip__date">{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                  <div className="news-strip__rule-thick" aria-hidden="true" />
                </button>
              ) : (
                <div className="news-strip__top">
                  <div className="news-strip__masthead">
                    <OutletLogo outlet={article.outlet} />
                  </div>
                  <div className="news-strip__meta">
                    <span className="news-strip__tag">{tagLabel}</span>
                    <span className="news-strip__date">{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              )}
              {!isOpen ? <div className="news-strip__rule-thick" aria-hidden="true" /> : null}
              {fold && !isLast && !isOpen ? <span className={`news-strip__foldcorner news-strip__foldcorner--${fold}`} aria-hidden="true" /> : null}

              {/* One headline element throughout - it used to be a clamped
                  preview (h3) that faded out while a second, unclamped copy
                  (h2) of the same text faded in beside it, which read as the
                  headline being swapped/refreshed rather than continuing.
                  Now it just gains its clipped lines back the moment the
                  strip opens (an instant class toggle - -webkit-line-clamp
                  itself can't be smoothly interpolated without a second,
                  measured element), and only the rule/snippet/link grow in
                  below it via the accordion. */}
              <h3 className={`news-strip__headline ink-text--heavy${isOpen ? ' news-strip__headline--open' : ''}`}>
                {article.headline}
              </h3>

              <div className="news-strip__expand">
                <div className="news-strip__expand-inner">
                  <div className="media-article__rule" aria-hidden="true" />
                  <p className="news-strip__snippet">
                    {article.snippet || 'No preview text was returned for this article — read it in full at the source.'}
                  </p>
                  <a className="news-strip__link" href={article.link} target="_blank" rel="noreferrer">
                    Read full article at {outletName} →
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
