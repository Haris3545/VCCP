import AppShell from '@/components/layout/AppShell';
import DashboardView from '@/components/dashboard/DashboardView';
import { getDashboardData } from '@/lib/dataSource';

export default function DashboardPage({ data }) {
  return (
    <AppShell title="Dashboard">
      <div className="page-head">
        <div className="page-head__title">
          <span className="eyebrow">Roll-up</span>
          <h1>Dashboard</h1>
        </div>
      </div>
      <DashboardView data={data} />
    </AppShell>
  );
}

export async function getStaticProps() {
  const data = await getDashboardData();
  return { props: { data } };
}
