import Sparkline from './Sparkline';
import SimulatedBadge from './SimulatedBadge';

export default function KpiCard({ kpi }) {
  const positive = kpi.delta >= 0;
  return (
    <div className="card">
      <div className="kpi-card__label">{kpi.label}</div>
      <div className="kpi-card__value-row">
        <span className="kpi-card__value">{kpi.value}</span>
        <span className="kpi-card__unit">{kpi.unit}</span>
      </div>
      <Sparkline data={kpi.series} positive={positive} />
      <div className="kpi-card__foot">
        <span className={`delta ${positive ? 'delta--up' : 'delta--down'}`}>
          {positive ? '▲' : '▼'} {Math.abs(kpi.delta)}
        </span>
        <SimulatedBadge />
      </div>
    </div>
  );
}
