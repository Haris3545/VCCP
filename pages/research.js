import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function ResearchPage() {
  return (
    <AppShell title="Research">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Research</h1>
          <span className="eyebrow">Qualitative research &amp; insights</span>
        </div>
      </div>
      <PlaceholderView description="Qualitative research, reports, and supporting insights will land here once this section is built out." />
    </AppShell>
  );
}
