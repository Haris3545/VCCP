import SourceSection from '@/components/ui/SourceSection';

export default function SocialListeningView({ data }) {
  const { discourse } = data;

  return (
    <SourceSection title="Fan discourse" eyebrow="Reddit" result={discourse}>
      {discourse?.source === 'live' && (
        <>
          {discourse.topPosts.length > 0 && (
            <>
              <h3 style={{ marginBottom: 6, fontSize: 14 }}>r/{discourse.subreddit} — hot right now</h3>
              {discourse.topPosts.map((p) => (
                <div className="list-row" key={p.id}>
                  <a href={p.permalink} target="_blank" rel="noreferrer">
                    {p.title}
                  </a>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                    {p.score} pts · {p.numComments} comments
                  </span>
                </div>
              ))}
            </>
          )}
          {discourse.recentMentions.length > 0 && (
            <>
              <h3 style={{ marginTop: 16, marginBottom: 6, fontSize: 14 }}>Recent mentions site-wide</h3>
              {discourse.recentMentions.map((p) => (
                <div className="list-row" key={p.id}>
                  <a href={p.permalink} target="_blank" rel="noreferrer">
                    {p.title}
                  </a>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>r/{p.subreddit}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </SourceSection>
  );
}
