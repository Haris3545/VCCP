import { useState } from 'react';
import SourceBadge from '@/components/ui/SourceBadge';

// Deterministic per-index tilt/lift so tabs read as a loose stack of torn
// clippings rather than a perfectly even row — repeats every 8 tabs.
const TILTS = [-2.2, 1.6, -1.1, 2.4, -1.7, 1.2, -2.6, 1.9];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MediaView({ data }) {
  const news = data?.news;
  const articles = news?.source === 'live' ? news.articles : [];
  const [activeIndex, setActiveIndex] = useState(0);

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

  const active = articles[Math.min(activeIndex, articles.length - 1)];

  return (
    <div className="media-newsroom">
      <div className="media-newsroom__head">
        <span className="eyebrow">Live coverage agent</span>
        <span className="media-newsroom__updated">
          Last swept {formatDate(news.fetchedAt)} · {articles.length} clippings
        </span>
      </div>

      <div className="media-tabs">
        {articles.map((article, i) => (
          <button
            key={article.link}
            type="button"
            className={`media-tab${i === activeIndex ? ' media-tab--active' : ''}`}
            style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}
            onClick={() => setActiveIndex(i)}
          >
            <span className="media-tab__outlet">{article.outlet}</span>
            <span className="media-tab__headline">{article.headline}</span>
            <span className="media-tab__date">{formatDate(article.publishedAt)}</span>
          </button>
        ))}
      </div>

      <article className="media-article" key={active.link}>
        <div className="media-article__masthead">
          <span className="media-article__eyebrow">{active.outlet}</span>
          <span className="media-article__date">{formatDate(active.publishedAt)}</span>
        </div>
        <h2 className="media-article__headline">{active.headline}</h2>
        <div className="media-article__rule" aria-hidden="true" />
        <p className="media-article__snippet">
          {active.snippet || 'No preview text was returned for this article — read it in full at the source.'}
        </p>
        <a className="media-article__link" href={active.link} target="_blank" rel="noreferrer">
          Read full article at {active.outlet} →
        </a>
      </article>
    </div>
  );
}
