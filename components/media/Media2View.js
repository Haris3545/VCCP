import { useMemo, useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';
import { CATEGORIES, deriveCategory, formatDate, cleanOutletName } from '@/lib/media/helpers';
import { MediaTrendIndex } from './MediaView';

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

      <div className="media2__grid">
        {articles.map((article) => {
          const isOpen = article.link === openLink;
          const tagLabel = CATEGORIES.find((c) => c.id === article.category)?.label.toUpperCase() || 'CULTURE';
          const outletName = cleanOutletName(article.outlet);

          return (
            <article key={article.link} className={`media2-pill${isOpen ? ' media2-pill--open' : ''}`}>
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
                  <a className="media2-pill__link" href={article.link} target="_blank" rel="noreferrer">
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
