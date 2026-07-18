import EmptyState from '@/components/ui/EmptyState';
import KpiGrid from './KpiGrid';
import TrendChart from './TrendChart';

export default function DashboardView({ data }) {
  const anyLive = data.kpis.some((kpi) => kpi.source === 'live') || data.trend?.source === 'live';

  return (
    <>
      {!anyLive && (
        <EmptyState>
          Awaiting live source connections — figures below are illustrative simulated data.
        </EmptyState>
      )}

      <KpiGrid kpis={data.kpis} />

      <div className="grid grid--2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="eyebrow">Summary</div>
          <p style={{ marginTop: 10, color: 'var(--paper)' }}>{data.summary}</p>
        </div>
        <TrendChart trend={data.trend} />
      </div>
    </>
  );
}
