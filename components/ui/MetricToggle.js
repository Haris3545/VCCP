export default function MetricToggle({ options, value, onChange }) {
  return (
    <div className="metric-toggle" role="tablist" aria-label="Metric">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="tab"
          aria-selected={opt === value}
          className={`metric-toggle__opt${opt === value ? ' metric-toggle__opt--active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
