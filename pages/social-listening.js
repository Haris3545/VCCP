import AppShell from '@/components/layout/AppShell';
import PlaceholderView from '@/components/ui/PlaceholderView';

export default function SocialListeningPage() {
  return (
    <AppShell title="Social listening">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Social listening</h1>
          <span className="eyebrow">Conversation &amp; sentiment tracking</span>
        </div>
      </div>
      <PlaceholderView description="Mention volume, sentiment breakdown, and trending conversation topics will land here once a social-listening source is connected." />
    </AppShell>
  );
}
