import AppShell from '@/components/layout/AppShell';
import IdeasView from '@/components/ideas/IdeasView';
import { listIdeas } from '@/lib/ideas/store';

export default function IdeasPage({ initialResult }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Ideas</h1>
          <span className="eyebrow">Creative concepts &amp; backlog</span>
        </div>
      </div>
      <IdeasView initialResult={initialResult} />
    </>
  );
}

IdeasPage.getLayout = function getLayout(page) {
  return <AppShell title="Ideas">{page}</AppShell>;
};

// Server-rendered rather than getStaticProps + revalidate like the other
// tabs — ideas and swipe decisions are shared across everyone using the
// console, so a stale ISR cache would mean people see different decks
// depending on when the page last regenerated. Every load here is fresh.
export async function getServerSideProps() {
  const initialResult = await listIdeas();
  return { props: { initialResult } };
}
