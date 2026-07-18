import { useEffect } from 'react';
import Head from 'next/head';
import artistConfig from '@/lib/artist.config';
import { useLocalStorage } from '@/lib/useLocalStorage';
import DashboardBackground from './DashboardBackground';
import Header from './Header';
import Ticker from './Ticker';
import FloatingTabNav from './FloatingTabNav';
import RefreshButton from './RefreshButton';
import PreviewToggle from './PreviewToggle';
import PreviewBanner from './PreviewBanner';

const NEXT_PREVIEW_MODE = { auto: 'mobile', mobile: 'desktop', desktop: 'auto' };

export default function AppShell({ children, title }) {
  const pageTitle = title ? `${title} · ${artistConfig.wordmark}` : artistConfig.meta.title;

  // Owned here (not inside PreviewToggle) so PreviewBanner can render as a
  // sibling of .app-shell instead of inside it — in mobile-preview mode,
  // .app-shell gets a transform to confine its own position:fixed
  // descendants (the background photo) to the phone-width frame, and the
  // banner needs to escape that and cover the tester's real viewport, not
  // get trapped in the frame too.
  const [previewMode, setPreviewMode] = useLocalStorage('previewMode', 'auto');

  useEffect(() => {
    if (previewMode === 'auto') {
      delete document.documentElement.dataset.preview;
    } else {
      document.documentElement.dataset.preview = previewMode;
    }
  }, [previewMode]);

  return (
    <>
      <PreviewBanner mode={previewMode} onReset={() => setPreviewMode('auto')} />
      <div className="app-shell">
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={artistConfig.meta.description} />
        </Head>
        <DashboardBackground />
        <Header />
        <Ticker />
        <main className="container page">{children}</main>
        <footer className="page-footer container">
          <RefreshButton />
          <PreviewToggle mode={previewMode} onCycle={() => setPreviewMode((m) => NEXT_PREVIEW_MODE[m] ?? 'auto')} />
        </footer>
        {/* Inside .app-shell (not a PreviewBanner-style sibling) so mobile
            preview's transform confines it to the simulated phone frame the
            same way it confines DashboardBackground, rather than floating
            it over the tester's real full-width viewport. */}
        <FloatingTabNav />
      </div>
    </>
  );
}
