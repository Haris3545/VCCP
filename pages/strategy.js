import AppShell from '@/components/layout/AppShell';
import StrategyView from '@/components/strategy/StrategyView';
import { getStrategyDefaults } from '@/lib/dataSource';

export default function StrategyPage({ defaults }) {
  return (
    <AppShell title="Strategy">
      <div className="page-head">
        <div className="page-head__title">
          <span className="eyebrow">Strategy on a Page / Plan on a Page</span>
          <h1>Strategy</h1>
        </div>
      </div>
      <StrategyView defaults={defaults} />
    </AppShell>
  );
}

export async function getStaticProps() {
  const defaults = await getStrategyDefaults();
  return { props: { defaults } };
}
