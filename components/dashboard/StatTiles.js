import artistConfig from '@/lib/artist.config';
import SimulatedBadge from '@/components/ui/SimulatedBadge';

export default function StatTiles({ stats }) {
  return (
    <div className="grid grid--stats">
      {stats.map((stat) => (
        <div className="card" key={stat.id}>
          <div className="kpi-card__label">
            {stat.id === 'in-media' ? `${artistConfig.artistName} in media` : stat.label}
          </div>
          <div className="kpi-card__value-row">
            <span className="kpi-card__value">{stat.value}</span>
            {stat.unit && <span className="kpi-card__unit">{stat.unit}</span>}
          </div>
          <div className="kpi-card__foot">
            <span className="kpi-card__caption">
              {stat.id === 'in-media' ? `${stat.caption} ${artistConfig.artistName}` : stat.caption}
            </span>
            <SimulatedBadge source={stat.source} />
          </div>
        </div>
      ))}
    </div>
  );
}
