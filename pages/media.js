import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function MediaPage() {
  return (
    <AppShell title="Media">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Media</h1>
          <span className="eyebrow">Press &amp; media coverage</span>
        </div>
      </div>
      <PlaceholderView description="Press mentions, coverage volume, and outlet breakdowns will land here once a media-monitoring source is connected." />
    </AppShell>
  );
}
