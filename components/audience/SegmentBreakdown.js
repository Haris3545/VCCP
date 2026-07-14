import SegmentTable from '@/components/ui/SegmentTable';

export default function SegmentBreakdown({ group, metric }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card__head">
        <h2>{group.question}</h2>
      </div>
      <SegmentTable group={group} metric={metric} />
    </div>
  );
}
