import Head from 'next/head';
import artistConfig from '@/lib/artist.config';
import DashboardBackground from './DashboardBackground';
import Header from './Header';
import Ticker from './Ticker';
import TabBar from './TabBar';
import MobileNav from './MobileNav';
import RefreshButton from './RefreshButton';
import PreviewToggle from './PreviewToggle';
import GlassPointer from './GlassPointer';

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
      {/* Mounted at the shell level, not inside Header, so its trigger's
          z-index competes directly with the full-screen panel's instead of
          being capped by Header's own stacking context (position:sticky +
          z-index create one). It self-positions with position:fixed. */}
      <MobileNav />
      <Ticker />
      <TabBar />
      <main className="container page">{children}</main>
      <footer className="page-footer container">
        <RefreshButton />
        <PreviewToggle />
      </footer>
      <GlassPointer />
    </div>
  );
}
