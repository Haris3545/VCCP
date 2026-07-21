import { useMemo, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';
import PillToggle from '@/components/ui/PillToggle';
import { CATEGORIES, deriveCategory, formatDate, cleanOutletName } from '@/lib/media/helpers';
import { MediaTrendIndex } from './MediaView';

// One intuitive colour per topic, picked so a whole grid of these reads
// at a glance without a legend - deliberately clear of green/red, which
// are reserved for trend up/down elsewhere in the app (artist.config.js).
const CATEGORY_COLORS = {
  music: '#6c8bff',
  film: '#ff9d5c',
  style: '#e37cc9',
  celebrity: '#b78cff',
  culture: '#7fd8d0',
};

// Same underlying feed and derivation as MediaView (see lib/media/helpers)
// but none of the newspaper aesthetic - flat, rounded pill cards in a
// grid instead of a tilted paper stack, each one expanding in place on
// click rather than unfurling. A second, more minimal take on the same
// data rather than a replacement for the newspaper version.
export default function Media2View({ data }) {
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
    <div className="media2">
      <MediaTrendIndex trendStats={data.trendStats} />

      <div className="media-newsroom__head">
        <span className="eyebrow">Live coverage agent</span>
        <span className="media-newsroom__updated">
          Last swept {formatDate(news.fetchedAt)} · {allArticles.length} clippings
        </span>
      </div>

      <PillToggle options={CATEGORIES} value={category} onChange={setCategory} className="pill-toggle--categories" />

      <div className={`media2__grid${openLink ? ' media2__grid--focused' : ''}`}>
        {/* A click anywhere on it closes the open pill, same as clicking the
            pill itself once expanded - covers the rest of the grid rather
            than the whole viewport, since "everything else" here means the
            other cards, not the page chrome around them. */}
        {openLink ? <div className="media2-backdrop" onClick={() => setOpenLink(null)} aria-hidden="true" /> : null}
        {articles.map((article, i) => {
          const isOpen = article.link === openLink;
          const tagLabel = CATEGORIES.find((c) => c.id === article.category)?.label.toUpperCase() || 'CULTURE';
          const outletName = cleanOutletName(article.outlet);

          return (
            <article
              key={article.link}
              className={`media2-pill${isOpen ? ' media2-pill--open' : ''}`}
              // Staggered per card (capped for a long feed) so the grid
              // visibly settles in rather than the whole thing appearing
              // at once - see .media2-pill's entrance animation.
              style={{
                '--cat-color': CATEGORY_COLORS[article.category] || CATEGORY_COLORS.culture,
                '--stagger-delay': `${Math.min(i * 35, 420)}ms`,
              }}
              // Once open, clicking anywhere on the pill (not just its
              // header) minimises it again - the "Go to article" link
              // below stops this from firing so following it doesn't
              // also collapse the pill out from under the new tab.
              onClick={isOpen ? () => setOpenLink(null) : undefined}
            >
              <button
                type="button"
                className="media2-pill__toggle"
                onClick={() => setOpenLink(isOpen ? null : article.link)}
                aria-expanded={isOpen}
              >
                <div className="media2-pill__top">
                  <span className="media2-pill__tag">{tagLabel}</span>
                  <span className="media2-pill__outlet">{outletName}</span>
                  <span className="media2-pill__date">{formatDate(article.publishedAt)}</span>
                </div>
                <h3 className="media2-pill__headline">{article.headline}</h3>
              </button>

              <div className="media2-pill__expand">
                <div className="media2-pill__expand-inner">
                  <p className="media2-pill__snippet">
                    {article.snippet || 'No preview text was returned for this article — read it in full at the source.'}
                  </p>
                  <a
                    className="media2-pill__go"
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Go to article
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
