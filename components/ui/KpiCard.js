import Sparkline from './Sparkline';
import SimulatedBadge from './SimulatedBadge';

function describeTrend(series) {
  const values = series.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const first = values[0];
  const last = values[values.length - 1];
  const direction = last > first ? 'trending up' : last < first ? 'trending down' : 'holding steady';
  return { min, max, direction };
}

export default function KpiCard({ kpi }) {
  const positive = kpi.delta >= 0;
  const { min, max, direction } = describeTrend(kpi.series);

  return (
    <div className="kpi-flip">
      <div className="kpi-flip__inner">
        <div className="kpi-flip__face kpi-flip__face--front card">
          <div className="kpi-card__label">{kpi.label}</div>
          <div className="kpi-card__value-row">
            <span className="kpi-card__value">{kpi.value}</span>
            <span className="kpi-card__unit">{kpi.unit}</span>
          </div>
          <div className="kpi-card__foot">
            <span className={`delta ${positive ? 'delta--up' : 'delta--down'}`}>
              {positive ? '▲' : '▼'} {Math.abs(kpi.delta)}
            </span>
            <SimulatedBadge />
          </div>
        </div>

        <div className="kpi-flip__face kpi-flip__face--back card">
          <div className="kpi-card__label">{kpi.label}</div>
          <Sparkline data={kpi.series} positive={positive} height={64} />
          <div className="kpi-flip__insight">
            {direction} · range {min}–{max}
            {kpi.unit.trim()}
          </div>
        </div>
      </div>
    </div>
  );
}
