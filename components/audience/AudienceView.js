import { useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import MetricToggle from '@/components/ui/MetricToggle';
import SegmentBreakdown from './SegmentBreakdown';

export default function AudienceView({ data }) {
  const [metric, setMetric] = useState(data.metrics[0]);

  return (
    <>
      <EmptyState>{`${data.updatedAtLabel} — segment values below are illustrative.`}</EmptyState>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div className="eyebrow">
          Segments: {data.segments.map((s) => s.label).join(' · ')}
        </div>
        <MetricToggle options={data.metrics} value={metric} onChange={setMetric} />
      </div>

      {data.groups.map((group) => (
        <SegmentBreakdown key={group.question} group={group} metric={metric} />
      ))}
    </>
  );
}
