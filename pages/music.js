import AppShell from '@/components/layout/AppShell';
import MusicView from '@/components/music/MusicView';
import { getMusicData } from '@/lib/dataSource';

export default function MusicPage({ data }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Music</h1>
          <span className="eyebrow">Streaming &amp; catalogue performance</span>
        </div>
      </div>
      <MusicView data={data} />
    </>
  );
}

MusicPage.getLayout = function getLayout(page) {
  return <AppShell title="Music">{page}</AppShell>;
};

export async function getStaticProps() {
  const data = await getMusicData();
  return { props: { data }, revalidate: 3600 };
}
