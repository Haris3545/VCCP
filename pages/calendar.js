import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function CalendarPage() {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Calendar</h1>
          <span className="eyebrow">Content &amp; release calendar</span>
        </div>
      </div>
      <PlaceholderView description="Upcoming content, release dates, and key cultural moments will land here once this section is built out." />
    </>
  );
}

CalendarPage.getLayout = function getLayout(page) {
  return <AppShell title="Calendar">{page}</AppShell>;
};
