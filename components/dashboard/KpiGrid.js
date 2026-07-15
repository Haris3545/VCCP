import { useEffect, useState } from 'react';
import KpiCard from '@/components/ui/KpiCard';

// Picks the largest column count (up to the tier's max) that divides evenly
// into the card count, so the grid never ends on a half-empty row. Falls
// back to 1 column for counts that don't divide cleanly at any tier.
function pickColumns(count, width) {
  let maxCols;
  if (width >= 1100) maxCols = 4;
  else if (width >= 760) maxCols = 3;
  else if (width >= 480) maxCols = 2;
  else maxCols = 1;

  for (let cols = Math.min(maxCols, count); cols >= 1; cols--) {
    if (count % cols === 0) return cols;
  }
  return 1;
}

export default function KpiGrid({ kpis }) {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    function update() {
      setColumns(pickColumns(kpis.length, window.innerWidth));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [kpis.length]);

  return (
    <div className="grid grid--kpi" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
