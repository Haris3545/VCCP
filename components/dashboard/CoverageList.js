import artistConfig from '@/lib/artist.config';
import SimulatedBadge from '@/components/ui/SimulatedBadge';

export default function CoverageList({ coverage }) {
  return (
    <div className="card">
      <div className="card__head">
        <div>
          <div className="eyebrow">Coverage</div>
          <h2 style={{ marginTop: 4 }}>Most relevant {artistConfig.artistName} coverage</h2>
        </div>
        <SimulatedBadge source="simulated" />
      </div>
      <div className="scroll-panel">
        {coverage.map((item) => (
          <div className="list-row" key={item.id}>
            <span>{item.title}</span>
            <span className="coverage-row__category" style={{ marginLeft: 'auto' }}>
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
