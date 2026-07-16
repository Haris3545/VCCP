import AppShell from '@/components/layout/AppShell';
import AudienceView from '@/components/audience/AudienceView';
import { getAudienceData } from '@/lib/dataSource';

export default function AudiencePage({ data }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Audience</h1>
          <span className="eyebrow">GWI segments</span>
        </div>
      </div>
      <AudienceView data={data} />
    </>
  );
}

AudiencePage.getLayout = function getLayout(page) {
  return <AppShell title="Audience">{page}</AppShell>;
};

export async function getStaticProps() {
  const data = await getAudienceData();
  return { props: { data } };
}
