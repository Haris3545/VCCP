import Donut from '@/components/ui/Donut';

const LABELS = { owned: 'Owned', earned: 'Earned', shared: 'Shared', paid: 'Paid' };

export default function OespMix({ value, onChange }) {
  const total = Object.values(value).reduce((sum, n) => sum + Number(n || 0), 0);
  const donutData = Object.entries(value).map(([key, v]) => ({ name: LABELS[key], value: v }));

  const setField = (key) => (e) => {
    const next = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    onChange({ ...value, [key]: next });
  };

  return (
    <div>
      <Donut data={donutData} />
      <div className="grid grid--2" style={{ marginTop: 18, gap: 10 }}>
        {Object.keys(LABELS).map((key) => (
          <label
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {LABELS[key]}
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={value[key]}
              onChange={setField(key)}
              style={{
                width: 64,
                background: 'var(--bg)',
                border: '1px solid var(--border-strong)',
                color: 'var(--paper)',
                borderRadius: 2,
                padding: '4px 6px',
                textAlign: 'right',
              }}
            />
          </label>
        ))}
      </div>
      {total !== 100 ? (
        <div className="oesp-warning">Mix totals {total}% — expected 100%.</div>
      ) : null}
    </div>
  );
}
