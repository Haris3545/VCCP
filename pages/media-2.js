import AppShell from '@/components/layout/AppShell';
import Media2View from '@/components/media/Media2View';
import { getMediaData } from '@/lib/dataSource';

export default function Media2Page({ data }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Media 2</h1>
          <span className="eyebrow">Press &amp; media coverage — minimal view</span>
        </div>
      </div>
      <Media2View data={data} />
    </>
  );
}

Media2Page.getLayout = function getLayout(page) {
  return <AppShell title="Media 2">{page}</AppShell>;
};

export async function getStaticProps() {
  const data = await getMediaData();
  return { props: { data }, revalidate: 1800 };
}
