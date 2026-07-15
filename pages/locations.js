import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function LocationsPage() {
  return (
    <AppShell title="Locations">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Locations</h1>
          <span className="eyebrow">Geographic &amp; market breakdown</span>
        </div>
      </div>
      <PlaceholderView description="Market-by-market performance and geographic breakdowns will land here once a location-level data source is connected." />
    </AppShell>
  );
}
