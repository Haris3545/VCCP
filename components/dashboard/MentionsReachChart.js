import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SimulatedBadge from '@/components/ui/SimulatedBadge';

const MENTIONS_COLOR = 'var(--paper)';
const REACH_COLOR = 'var(--accent)';

export default function MentionsReachChart({ trend }) {
  if (!trend) return null;
  const data = trend.mentions.map((point, i) => ({
    i: point.i,
    mentions: point.v,
    reach: trend.reach[i]?.v ?? 0,
  }));

  return (
    <div className="card">
      <div className="mentions-chart__head">
        <div>
          <div className="eyebrow">Mentions &amp; reach</div>
        </div>
        <SimulatedBadge source={trend.source} />
      </div>
      <div className="mentions-chart__plot">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="mentions"
              name="Mentions"
              stroke={MENTIONS_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="reach"
              name="Reach"
              stroke={REACH_COLOR}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mentions-chart__legend">
        <span className="mentions-chart__legend-item">
          <span className="mentions-chart__legend-swatch" style={{ background: MENTIONS_COLOR }} />
          Mentions
        </span>
        <span className="mentions-chart__legend-item">
          <span className="mentions-chart__legend-swatch" style={{ background: REACH_COLOR }} />
          Reach
        </span>
      </div>
    </div>
  );
}
