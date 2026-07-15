// Renders "Live" once a real data source is connected, "Simulated" until
// then — same component, so call sites never need to branch on source.
export default function SimulatedBadge({ source = 'simulated' }) {
  const isLive = source === 'live';
  return (
    <span className={`badge ${isLive ? 'badge--live' : 'badge--simulated'}`}>
      {isLive ? 'Live' : 'Simulated'}
    </span>
  );
}
