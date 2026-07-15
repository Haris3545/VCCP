import AppShell from '@/components/layout/AppShell';
import DashboardView from '@/components/dashboard/DashboardView';
import { getDashboardData } from '@/lib/dataSource';

export default function DashboardPage({ data }) {
  return (
    <AppShell title="Dashboard">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Dashboard</h1>
          <span className="eyebrow">Roll-up</span>
        </div>
      </div>
      <DashboardView data={data} />
    </AppShell>
  );
}

export async function getStaticProps() {
  const data = await getDashboardData();
  return { props: { data }, revalidate: 3600 };
}
