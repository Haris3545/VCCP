import SourceSection from '@/components/ui/SourceSection';

function formatNumber(n) {
  return typeof n === 'number' ? n.toLocaleString('en-US') : '—';
}

export default function YouTubeView({ data }) {
  const { overview } = data;

  return (
    <SourceSection title="Channel overview" eyebrow="YouTube Data API" result={overview}>
      {overview?.source === 'live' && (
        <>
          <div className="list-row">
            <strong>{formatNumber(overview.subscriberCount)}</strong>
            <span style={{ color: 'var(--muted)' }}>subscribers</span>
            <strong style={{ marginLeft: 'auto' }}>{formatNumber(overview.viewCount)}</strong>
            <span style={{ color: 'var(--muted)' }}>total views</span>
          </div>
          <h3 style={{ marginTop: 16, marginBottom: 6, fontSize: 14 }}>Recent uploads</h3>
          {overview.recentVideos.map((v) => (
            <div className="list-row" key={v.id}>
              <span>{v.title}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {formatNumber(v.viewCount)} views
              </span>
            </div>
          ))}
        </>
      )}
    </SourceSection>
  );
}
