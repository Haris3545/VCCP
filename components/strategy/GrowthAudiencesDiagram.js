import EditableField from '@/components/ui/EditableField';

export default function GrowthAudiencesDiagram({ value, onChange }) {
  const set = (key) => (next) => onChange({ ...value, [key]: next });
  return (
    <div className="growth-diagram">
      <div className="growth-diagram__rings">
        <div className="growth-diagram__ring growth-diagram__ring--reach">
          <span className="growth-diagram__label">
            <EditableField value={value.reach} onChange={set('reach')} />
          </span>
        </div>
        <div className="growth-diagram__ring growth-diagram__ring--adjacent">
          <span className="growth-diagram__label">
            <EditableField value={value.adjacent} onChange={set('adjacent')} />
          </span>
        </div>
        <div className="growth-diagram__ring growth-diagram__ring--core">
          <span className="growth-diagram__label">
            <EditableField value={value.core} onChange={set('core')} />
          </span>
        </div>
      </div>
    </div>
  );
}
