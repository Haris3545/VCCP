import EmptyState from '@/components/ui/EmptyState';
import { STUDIO_NAME } from '@/lib/constants';

// Deterministic per-letter jitter — same "hand-set" trick as the reference
// site's warped wordmark, without needing an actual illustrated asset.
const JIT = [-3, 2, -1, 3, -2, 1, 0, -2, 3, -1, 2, -3, 1, 0, -2];

function Wobble({ text }) {
  return (
    <span className="dash-hero__wordmark-line">
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          className="dash-hero__wobble-letter"
          style={{
            transform: `rotate(${JIT[i % JIT.length] * 0.7}deg) translateY(${JIT[(i + 4) % JIT.length] * 0.6}px)`,
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

// A test run of the bigger, more graphic "editorial hero" treatment —
// dashboard-only for now. Same real data as the old KpiGrid/TrendChart view
// (data.summary, data.kpis), just given the giant-type, huge-number
// treatment instead of a small card grid.
export default function DashboardHero({ data }) {
  const anyLive = data.kpis.some((kpi) => kpi.source === 'live') || data.trend?.source === 'live';
  const heroStats = data.kpis.slice(0, 3);
  const wordmarkLines = STUDIO_NAME.toUpperCase().split(' ');

  return (
    <div className="dash-hero">
      {!anyLive && (
        <EmptyState>Awaiting live source connections — figures below are illustrative simulated data.</EmptyState>
      )}

      <div className="dash-hero__grid">
        <div className="dash-hero__wordmark-wrap">
          <div className="dash-hero__wordmark">
            {wordmarkLines.map((line) => (
              <Wobble key={line} text={line} />
            ))}
          </div>
        </div>

        <div className="dash-hero__panel">
          <div className="dash-hero__kicker">Status report</div>
          <h1 className="dash-hero__headline">THE NUMBERS BEHIND THIS WEEK&rsquo;S CULTURAL MOMENTUM.</h1>
          <p className="dash-hero__body">{data.summary}</p>
        </div>
      </div>

      <div className="dash-hero__stats" style={{ '--stat-count': heroStats.length }}>
        {heroStats.map((kpi) => (
          <div className="dash-hero__stat" key={kpi.id}>
            <div className="dash-hero__stat-value">
              {kpi.value}
              <span className="dash-hero__stat-unit">{kpi.unit}</span>
            </div>
            <div className="dash-hero__stat-label">{kpi.label}</div>
            <div className={`dash-hero__stat-delta${kpi.delta < 0 ? ' dash-hero__stat-delta--down' : ''}`}>
              {kpi.delta > 0 ? '+' : ''}
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
