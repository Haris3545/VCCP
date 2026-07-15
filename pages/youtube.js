import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function YouTubePage() {
  return (
    <AppShell title="YouTube">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>YouTube</h1>
          <span className="eyebrow">Views &amp; engagement</span>
        </div>
      </div>
      <PlaceholderView description="Video views, watch time, and engagement trends will land here once the YouTube data source is connected." />
    </AppShell>
  );
}
