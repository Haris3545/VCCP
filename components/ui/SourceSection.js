import SourceBadge from './SourceBadge';

// One card per data source on the multi-source pages (Music, YouTube,
// Social listening). Shows the connect-me reason inline instead of a full
// PlaceholderView, so a page with 3 of 5 sources connected still reads
// clearly rather than needing an all-or-nothing empty state.
export default function SourceSection({ title, eyebrow, result, children }) {
  const isLive = result?.source === 'live';
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card__head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 style={{ marginTop: 4 }}>{title}</h2>
        </div>
        <SourceBadge source={result?.source} />
      </div>
      {isLive ? (
        children
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 560 }}>
          {result?.reason || 'No data source configured for this section yet.'}
        </p>
      )}
    </div>
  );
}
