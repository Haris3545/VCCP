import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function TacticsPage() {
  return (
    <AppShell title="Tactics">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Tactics</h1>
          <span className="eyebrow">Campaign tactics &amp; activations</span>
        </div>
      </div>
      <PlaceholderView description="Planned and live activation tactics, with owners and status, will land here once this section is built out." />
    </AppShell>
  );
}
