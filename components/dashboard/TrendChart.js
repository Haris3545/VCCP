import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SimulatedBadge from '@/components/ui/SimulatedBadge';

export default function TrendChart({ trend }) {
  if (!trend) return null;
  const positive = trend.delta >= 0;

  return (
    <div className="card trend-chart">
      <div className="trend-chart__head">
        <div>
          <div className="trend-chart__label">{trend.label}</div>
          <div className="trend-chart__source">{trend.sourceLabel}</div>
        </div>
        <div className="trend-chart__value-row">
          <span className="trend-chart__value">
            {trend.value} <span className="kpi-card__unit">{trend.unit}</span>
          </span>
          <span className={`delta ${positive ? 'delta--up' : 'delta--down'}`}>
            {positive ? '▲' : '▼'} {Math.abs(trend.delta)}
          </span>
          <SimulatedBadge />
        </div>
      </div>
      <div className="trend-chart__plot">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.series} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: 12,
              }}
              labelFormatter={() => trend.label}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
