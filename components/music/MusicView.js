import SourceSection from '@/components/ui/SourceSection';

function formatNumber(n) {
  return typeof n === 'number' ? n.toLocaleString('en-US') : '—';
}

export default function MusicView({ data }) {
  const { spotify, discography, facts, discogs, streams, songs, setlists } = data;

  return (
    <>
      <SourceSection title="Spotify overview" eyebrow="Catalogue & popularity" result={spotify}>
        {spotify?.source === 'live' && (
          <>
            <div className="list-row">
              <strong>{formatNumber(spotify.followers)}</strong>
              <span style={{ color: 'var(--muted)' }}>followers</span>
              <strong style={{ marginLeft: 'auto' }}>{spotify.popularity}</strong>
              <span style={{ color: 'var(--muted)' }}>popularity /100</span>
            </div>
            {spotify.genres?.length > 0 && (
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
                {spotify.genres.join(' · ')}
              </p>
            )}
            <h3 style={{ marginTop: 16, marginBottom: 6, fontSize: 14 }}>Top tracks</h3>
            {(spotify.topTracks || []).map((t) => (
              <div className="list-row" key={t.id}>
                <span>{t.name}</span>
                <span style={{ color: 'var(--muted)' }}>{t.album}</span>
                <strong style={{ marginLeft: 'auto' }}>{t.popularity}</strong>
              </div>
            ))}
          </>
        )}
      </SourceSection>

      <SourceSection title="Discography" eyebrow="MusicBrainz" result={discography}>
        {discography?.source === 'live' &&
          discography.releaseGroups.slice(0, 20).map((rg) => (
            <div className="list-row" key={rg.id}>
              <span>{rg.title}</span>
              <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>
                {rg.primaryType?.toLowerCase()}
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {rg.firstReleaseDate || '—'}
              </span>
            </div>
          ))}
      </SourceSection>

      <SourceSection title="Facts & awards" eyebrow="Wikidata" result={facts}>
        {facts?.source === 'live' && (
          <>
            <div className="list-row">
              <span style={{ color: 'var(--muted)' }}>Born</span>
              <strong style={{ marginLeft: 'auto' }}>{facts.birthDate || '—'}</strong>
            </div>
            <div className="list-row">
              <span style={{ color: 'var(--muted)' }}>Genres</span>
              <strong style={{ marginLeft: 'auto' }}>{facts.genres.join(', ') || '—'}</strong>
            </div>
            {facts.awards.length > 0 && (
              <>
                <h3 style={{ marginTop: 16, marginBottom: 6, fontSize: 14 }}>Awards</h3>
                {facts.awards.map((a) => (
                  <div className="list-row" key={a}>
                    <span>{a}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </SourceSection>

      <SourceSection title="Releases & pressings" eyebrow="Discogs" result={discogs}>
        {discogs?.source === 'live' &&
          discogs.releases.slice(0, 20).map((r) => (
            <div className="list-row" key={r.id}>
              <span>{r.title}</span>
              <span style={{ color: 'var(--muted)' }}>{r.format}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{r.year || '—'}</span>
            </div>
          ))}
      </SourceSection>

      <SourceSection title="Streaming numbers" eyebrow="Kworb" result={streams}>
        {streams?.source === 'live' && streams.tracks.length > 0 && (
          <div className="scroll-x">
            <table className="segment-table">
              <thead>
                <tr>
                  {Object.keys(streams.tracks[0]).map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {streams.tracks.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SourceSection>

      <SourceSection title="Lyrics & annotations" eyebrow="Genius" result={songs}>
        {songs?.source === 'live' &&
          songs.songs.map((s) => (
            <div className="list-row" key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {formatNumber(s.pageViews)} views
              </span>
            </div>
          ))}
      </SourceSection>

      <SourceSection title="Live & tour history" eyebrow="Setlist.fm" result={setlists}>
        {setlists?.source === 'live' &&
          setlists.setlists.map((s) => (
            <div className="list-row" key={s.id}>
              <span>{s.eventDate}</span>
              <span>
                {s.venue}, {s.city}
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{s.tour || '—'}</span>
            </div>
          ))}
      </SourceSection>
    </>
  );
}
