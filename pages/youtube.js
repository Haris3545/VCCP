import AppShell from '@/components/layout/AppShell';
import YouTubeView from '@/components/youtube/YouTubeView';
import { getYoutubeData } from '@/lib/dataSource';

export default function YouTubePage({ data }) {
  return (
    <AppShell title="YouTube">
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>YouTube</h1>
          <span className="eyebrow">Views &amp; engagement</span>
        </div>
      </div>
      <YouTubeView data={data} />
    </AppShell>
  );
}

export async function getStaticProps() {
  const data = await getYoutubeData();
  return { props: { data }, revalidate: 3600 };
}
