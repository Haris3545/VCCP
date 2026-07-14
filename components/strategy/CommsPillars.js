import EditableField from '@/components/ui/EditableField';

export default function CommsPillars({ pillars, onChange }) {
  const updatePillar = (i, key) => (next) => {
    const copy = pillars.map((p, idx) => (idx === i ? { ...p, [key]: next } : p));
    onChange(copy);
  };

  return (
    <div className="pillar-row">
      {pillars.map((pillar, i) => (
        <div className="card pillar-card" key={pillar.name}>
          <div className="eyebrow">{pillar.name}</div>
          <div style={{ marginTop: 6, marginBottom: 10 }}>
            <EditableField
              as="span"
              value={pillar.window}
              onChange={updatePillar(i, 'window')}
              style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}
            />
          </div>
          <EditableField
            as="div"
            value={pillar.description}
            onChange={updatePillar(i, 'description')}
            style={{ fontSize: 13, lineHeight: 1.5 }}
          />
        </div>
      ))}
    </div>
  );
}
