import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import artistConfig from '@/lib/artist.config';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { isPageTransitionCovering, subscribePageTransitionCovering } from '@/lib/pageTransition';
import DashboardBackground from './DashboardBackground';
import Header from './Header';
import Ticker from './Ticker';
import FloatingTabNav from './FloatingTabNav';
import RefreshButton from './RefreshButton';
import PreviewToggle from './PreviewToggle';
import PreviewBanner from './PreviewBanner';
import GlassPointer from './GlassPointer';

const NEXT_PREVIEW_MODE = { auto: 'mobile', mobile: 'desktop', desktop: 'auto' };

// Keyed on the route by the caller, so it remounts (fresh state) on every
// page swap. Ordinary navigations have nothing covering the screen, so
// `ready` starts true and the fade-in plays immediately on mount. A
// login/logout-triggered navigation mounts while the circle overlay is
// still opaque, though — starting the fade there too would let it finish
// fully hidden behind the overlay, so `ready` instead starts false and
// waits for the overlay to release it right as the circle begins to
// reveal, so the two visibly cross-dissolve. The fallback timeout is a
// safety net in case that release signal is ever missed.
function PageEnter({ children }) {
  const [ready, setReady] = useState(() => !isPageTransitionCovering());

  useEffect(() => {
    if (ready) return undefined;
    // Covering can flip to false in the gap between the render above (which
    // read it as true) and this effect subscribing — e.g. with
    // prefers-reduced-motion, the overlay's whole close sequence fires on a
    // same-tick timer and can finish before this effect has even run. That
    // notification would otherwise be missed forever, so re-check the
    // current value before subscribing rather than trusting the stale read.
    if (!isPageTransitionCovering()) {
      setReady(true);
      return undefined;
    }
    const unsubscribe = subscribePageTransitionCovering((covering) => {
      if (!covering) setReady(true);
    });
    const fallback = setTimeout(() => setReady(true), 3000);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [ready]);

  return <div className={`page-enter${ready ? ' page-enter--ready' : ''}`}>{children}</div>;
}

export default function AppShell({ children, title }) {
  const pageTitle = title ? `${title} · ${artistConfig.wordmark}` : artistConfig.meta.title;
  const router = useRouter();

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
        <main className="container page">
          {/* Keyed on the route so each page swap remounts PageEnter and
              replays the fade-in — without the key, it persists across
              navigations (only `children` changes) and the animation would
              only ever play once. */}
          <PageEnter key={router.pathname}>{children}</PageEnter>
        </main>
        <footer className="page-footer container">
          <RefreshButton />
          <PreviewToggle mode={previewMode} onCycle={() => setPreviewMode((m) => NEXT_PREVIEW_MODE[m] ?? 'auto')} />
        </footer>
        <GlassPointer />
        {/* Inside .app-shell (not a PreviewBanner-style sibling) so mobile
            preview's transform confines it to the simulated phone frame the
            same way it confines DashboardBackground, rather than floating
            it over the tester's real full-width viewport. */}
        <FloatingTabNav />
      </div>
    </>
  );
}
