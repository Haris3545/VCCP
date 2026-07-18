import AppShell from '@/components/layout/AppShell';
import MediaView from '@/components/media/MediaView';
import { getMediaData } from '@/lib/dataSource';

export default function MediaPage({ data }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Media</h1>
          <span className="eyebrow">Press &amp; media coverage</span>
        </div>
      </div>
      <MediaView data={data} />
    </>
  );
}

MediaPage.getLayout = function getLayout(page) {
  return <AppShell title="Media">{page}</AppShell>;
};

export async function getStaticProps() {
  const data = await getMediaData();
  return { props: { data }, revalidate: 1800 };
}
