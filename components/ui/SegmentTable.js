import { audienceMock } from '@/lib/mockData/audience';

const HOT_THRESHOLD = { Index: 120, 'Column %': 45, 'Row %': 25, Responses: 400 };

export default function SegmentTable({ group, metric }) {
  const threshold = HOT_THRESHOLD[metric] ?? Infinity;
  return (
    <div className="scroll-x">
      <table className="segment-table">
        <thead>
          <tr>
            <th>{group.question}</th>
            {audienceMock.segments.map((seg) => (
              <th key={seg.key}>{seg.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              {audienceMock.segments.map((seg) => {
                const raw = row.values[metric]?.[seg.key];
                const hot = typeof raw === 'number' && raw >= threshold;
                return (
                  <td key={seg.key} className={hot ? 'segment-table__value--hot' : undefined}>
                    {raw ?? '—'}
                    {metric === 'Column %' || metric === 'Row %' ? '%' : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
