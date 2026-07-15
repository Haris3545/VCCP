import AppShell from '@/components/layout/AppShell';
import MusicView from '@/components/music/MusicView';
import { getMusicData } from '@/lib/dataSource';

export default function MusicPage({ data }) {
  return (
    <AppShell title="Music">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Music</h1>
          <span className="eyebrow">Streaming &amp; catalogue performance</span>
        </div>
      </div>
      <MusicView data={data} />
    </AppShell>
  );
}

export async function getStaticProps() {
  const data = await getMusicData();
  return { props: { data }, revalidate: 3600 };
}
