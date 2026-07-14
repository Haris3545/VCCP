import Head from 'next/head';
import artistConfig from '@/lib/artist.config';
import GrainOverlay from './GrainOverlay';
import Header from './Header';
import Ticker from './Ticker';

export default function AppShell({ children, title }) {
  const pageTitle = title ? `${title} · ${artistConfig.wordmark}` : artistConfig.meta.title;
  return (
    <div className="app-shell">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={artistConfig.meta.description} />
      </Head>
      <GrainOverlay />
      <Header />
      <Ticker />
      <main className="container page">{children}</main>
    </div>
  );
}
