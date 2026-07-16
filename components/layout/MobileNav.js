import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TabNav from './TabNav';
import LogoutButton from './LogoutButton';

// Touch-only nav: a fixed top-right trigger that morphs from two lines
// into an X, opening a full-screen panel with a left-aligned tab list.
// Deliberately a plain opacity/transform fade rather than the old
// button-position-driven clip-path circle reveal — that depended on
// measuring the trigger's on-screen position via getBoundingClientRect at
// the moment of toggling, which drifted whenever the page had scrolled,
// producing the "stuck" reveal. A fade has no coordinates to get wrong.
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    function handleRouteChange() {
      setOpen(false);
    }
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`hamburger${open ? ' is-open' : ''}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
      </button>

      <div className={`mobile-nav-panel${open ? ' is-open' : ''}`} id="mobile-nav-panel" aria-hidden={!open}>
        <TabNav />
        <div className="mobile-nav-panel__foot">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
