import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function IdeasPage() {
  return (
    <AppShell title="Ideas">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Ideas</h1>
          <span className="eyebrow">Creative concepts &amp; backlog</span>
        </div>
      </div>
      <PlaceholderView description="Creative concepts, pitches, and the idea backlog will land here once this section is built out." />
    </AppShell>
  );
}
