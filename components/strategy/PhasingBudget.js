import EditableField from '@/components/ui/EditableField';

export default function PhasingBudget({ phasing, onChange }) {
  const updateRow = (i, key) => (next) => {
    const copy = phasing.map((row, idx) =>
      idx === i ? { ...row, [key]: key === 'budgetPct' ? Number(next) || 0 : next } : row
    );
    onChange(copy);
  };

  const totalPct = phasing.reduce((sum, r) => sum + Number(r.budgetPct || 0), 0);

  return (
    <div className="scroll-x">
      <table className="segment-table" style={{ minWidth: 480 }}>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Dates</th>
            <th>Budget %</th>
            <th>Channels</th>
          </tr>
        </thead>
        <tbody>
          {phasing.map((row, i) => (
            <tr key={row.phase}>
              <td style={{ fontWeight: 700 }}>{row.phase}</td>
              <td>
                <EditableField value={row.dates} onChange={updateRow(i, 'dates')} />
              </td>
              <td>
                <EditableField value={String(row.budgetPct)} onChange={updateRow(i, 'budgetPct')} />%
              </td>
              <td>
                <EditableField value={row.channels} onChange={updateRow(i, 'channels')} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPct !== 100 ? (
        <div className="oesp-warning">Budget phasing totals {totalPct}% — expected 100%.</div>
      ) : null}
    </div>
  );
}
