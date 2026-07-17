import AppShell from '@/components/layout/AppShell';
import DashboardHero from '@/components/dashboard/DashboardHero';
import { getDashboardData } from '@/lib/dataSource';

export default function DashboardPage({ data }) {
  return <DashboardHero data={data} />;
}

DashboardPage.getLayout = function getLayout(page) {
  return <AppShell title="Dashboard">{page}</AppShell>;
};

export async function getStaticProps() {
  const data = await getDashboardData();
  return { props: { data }, revalidate: 3600 };
}
