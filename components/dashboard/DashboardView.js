import EmptyState from '@/components/ui/EmptyState';
import KpiGrid from './KpiGrid';

export default function DashboardView({ data }) {
  return (
    <>
      <EmptyState>
        Awaiting live source connections — figures below are illustrative simulated data.
      </EmptyState>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="eyebrow">Summary</div>
        <p style={{ marginTop: 10, color: 'var(--paper)', maxWidth: 760 }}>{data.summary}</p>
      </div>

      <h2 style={{ marginBottom: 14 }}>Key metrics</h2>
      <KpiGrid kpis={data.kpis} />
    </>
  );
}
