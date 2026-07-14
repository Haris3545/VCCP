export default function EmptyState({ children }) {
  return (
    <div className="empty-banner">
      <span aria-hidden="true">◐</span>
      <span>{children}</span>
    </div>
  );
}
