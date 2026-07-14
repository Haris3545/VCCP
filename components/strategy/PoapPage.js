import EditableField from '@/components/ui/EditableField';
import EditableList from '@/components/ui/EditableList';
import OespMix from './OespMix';
import PhasingBudget from './PhasingBudget';

export default function PoapPage({ poap, onChange }) {
  const set = (key) => (next) => onChange({ ...poap, [key]: next });

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card">
        <h2>Why — distinctive execution</h2>
        <div style={{ marginTop: 12 }}>
          <EditableField as="div" value={poap.why} onChange={set('why')} style={{ maxWidth: 760 }} />
        </div>
      </div>

      <div className="card">
        <h2>How — executional routes</h2>
        <div style={{ marginTop: 12 }}>
          <EditableList items={poap.how} onChange={set('how')} />
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <h2>What — OESP mix</h2>
          <div style={{ marginTop: 12 }}>
            <OespMix value={poap.oesp} onChange={set('oesp')} />
          </div>
        </div>
        <div className="card">
          <h2>Phasing &amp; budget</h2>
          <div style={{ marginTop: 12 }}>
            <PhasingBudget phasing={poap.phasing} onChange={set('phasing')} />
          </div>
        </div>
      </div>
    </div>
  );
}
