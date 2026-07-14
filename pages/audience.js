import AppShell from '@/components/layout/AppShell';
import AudienceView from '@/components/audience/AudienceView';
import { getAudienceData } from '@/lib/dataSource';

export default function AudiencePage({ data }) {
  return (
    <AppShell title="Audience">
      <div className="page-head">
        <div className="page-head__title">
          <span className="eyebrow">GWI segments</span>
          <h1>Audience</h1>
        </div>
      </div>
      <AudienceView data={data} />
    </AppShell>
  );
}

export async function getStaticProps() {
  const data = await getAudienceData();
  return { props: { data } };
}
