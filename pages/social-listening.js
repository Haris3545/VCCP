import AppShell from '@/components/layout/AppShell';
import SocialListeningView from '@/components/social/SocialListeningView';
import { getSocialListeningData } from '@/lib/dataSource';

export default function SocialListeningPage({ data }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <span className="page-head__bar" aria-hidden="true" />
          <h1>Social listening</h1>
          <span className="eyebrow">Conversation &amp; sentiment tracking</span>
        </div>
      </div>
      <SocialListeningView data={data} />
    </>
  );
}

SocialListeningPage.getLayout = function getLayout(page) {
  return <AppShell title="Social listening">{page}</AppShell>;
};

export async function getStaticProps() {
  const data = await getSocialListeningData();
  return { props: { data }, revalidate: 3600 };
}
