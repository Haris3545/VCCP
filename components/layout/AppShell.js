import Head from 'next/head';
import artistConfig from '@/lib/artist.config';
import DashboardBackground from './DashboardBackground';
import Header from './Header';
import Ticker from './Ticker';
import TabBar from './TabBar';
import RefreshButton from './RefreshButton';

export default function AppShell({ children, title }) {
  const pageTitle = title ? `${title} · ${artistConfig.wordmark}` : artistConfig.meta.title;
  return (
    <div className="app-shell">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={artistConfig.meta.description} />
      </Head>
      <DashboardBackground />
      <Header />
      <Ticker />
      <TabBar />
      <main className="container page">{children}</main>
      <RefreshButton />
    </div>
  );
}
