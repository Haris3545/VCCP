// For sections with no simulated fallback (nothing to show until a real
// integration is connected) — distinct from SimulatedBadge, which always
// has illustrative numbers behind it even when unconnected.
export default function SourceBadge({ source }) {
  const isLive = source === 'live';
  return (
    <span className={`badge ${isLive ? 'badge--live' : 'badge--simulated'}`}>
      {isLive ? 'Live' : 'Not connected'}
    </span>
  );
}
