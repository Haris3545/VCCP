import { useEffect, useRef, useState } from 'react';
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

const NEXT_PREVIEW_MODE = { auto: 'mobile', mobile: 'desktop', desktop: 'auto' };

// True once nothing is covering the screen (or once the overlay releases
// it). Ordinary navigations have nothing covering, so this resolves true
// immediately. A login/logout-triggered navigation mounts while the circle
// overlay is still opaque, so this instead starts false and waits for the
// overlay to release it right as the circle begins to reveal — the caller
// can hold its entrance animation until then so it cross-dissolves with the
// reveal instead of finishing while still hidden underneath it. The
// fallback timeout is a safety net in case that release signal is missed.
function useRevealReady() {
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

  return ready;
}

// Keyed on the route by the caller, so it remounts (fresh state) on every
// page swap and replays its fade-in.
function PageEnter({ children }) {
  const ready = useRevealReady();
  return <div className={`page-enter${ready ? ' page-enter--ready' : ''}`}>{children}</div>;
}

export default function AppShell({ children, title }) {
  const pageTitle = title ? `${title} · ${artistConfig.wordmark}` : artistConfig.meta.title;
  const router = useRouter();
  // AppShell itself mounts fresh exactly once per session (the standalone
  // /login page doesn't use it) and then persists across every later
  // navigation, so this only ever resolves once — right after a
  // login-triggered reveal, or immediately for a direct page load.
  const shellReady = useRevealReady();
  // Tracks whether PageEnter has ever been used yet. On the single render
  // where shellReady first turns true, content still rides along with the
  // shell's own fade (see the comment below) rather than getting wrapped in
  // its own PageEnter — set from an effect (post-commit), not during render,
  // so the render that actually needs to see "not yet" still does.
  const hasEnteredOnceRef = useRef(false);
  useEffect(() => {
    if (shellReady) hasEnteredOnceRef.current = true;
  }, [shellReady]);

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
      <div className={`app-shell${shellReady ? ' app-shell--ready' : ''}`}>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={artistConfig.meta.description} />
        </Head>
        <DashboardBackground />
        <Header />
        <Ticker />
        <main className="container page">
          {/* While the shell is hidden, and on the single render where it
              first becomes ready, content rides along unwrapped — it's
              covered by .app-shell's own opacity either way, and wrapping
              it in a freshly-mounted PageEnter on that same render would
              compound two opacity ramps (parent and child both animating
              0→1 at once) into a slower, murkier fade than either alone.
              Every route change after that first reveal swaps to PageEnter,
              keyed on the route so it remounts (fresh state) and replays
              its own fade for just the page body, without the chrome
              (background/header/ticker/nav) fading again. */}
          {hasEnteredOnceRef.current ? <PageEnter key={router.pathname}>{children}</PageEnter> : children}
        </main>
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
