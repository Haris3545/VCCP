import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function MusicPage() {
  return (
    <AppShell title="Music">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Music</h1>
          <span className="eyebrow">Streaming &amp; catalogue performance</span>
        </div>
      </div>
      <PlaceholderView description="Full-catalogue streaming trends, per-track breakdowns, and chart performance will land here once a music-data source is connected." />
    </AppShell>
  );
}
