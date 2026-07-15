import EmptyState from './EmptyState';

// Scaffold for sections whose data source isn't wired up yet. Once a real
// integration lands for a tab, replace its page's usage of this with an
// actual view component — this is intentionally not meant to be dressed up.
export default function PlaceholderView({ description }) {
  return (
    <>
      <EmptyState>Awaiting data source connection for this section.</EmptyState>
      <div className="card">
        <div className="eyebrow">Coming soon</div>
        <p style={{ marginTop: 10, color: 'var(--paper)', maxWidth: 640 }}>{description}</p>
      </div>
    </>
  );
}
