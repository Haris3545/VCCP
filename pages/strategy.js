import AppShell from '@/components/layout/AppShell';
import StrategyView from '@/components/strategy/StrategyView';
import { getStrategyDefaults } from '@/lib/dataSource';

export default function StrategyPage({ defaults }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Strategy</h1>
          <span className="eyebrow">Strategy on a Page / Plan on a Page</span>
        </div>
      </div>
      <StrategyView defaults={defaults} />
    </>
  );
}

StrategyPage.getLayout = function getLayout(page) {
  return <AppShell title="Strategy">{page}</AppShell>;
};

export async function getStaticProps() {
  const defaults = await getStrategyDefaults();
  return { props: { defaults } };
}
