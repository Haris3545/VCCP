export default function ResetButton({ onClick, label = 'Reset to default' }) {
  return (
    <button type="button" className="reset-btn" onClick={onClick}>
      ↺ {label}
    </button>
  );
}
