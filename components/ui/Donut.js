import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

const COLORS = ['#f4f2ea', '#d4d2d2', '#8a8a86', '#4a4a46'];

export default function Donut({ data }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ width: 140, height: 140, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={64}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="donut-legend">
        {data.map((entry, i) => (
          <div className="donut-legend__row" key={entry.name}>
            <span
              className="donut-legend__swatch"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span>{entry.name}</span>
            <strong style={{ marginLeft: 'auto' }}>{entry.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
