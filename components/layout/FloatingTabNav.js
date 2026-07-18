import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlassSurface } from '@/lib/useGlassSurface';

const NAV_TABS = [
  { tab: 'dashboard', label: 'Dashboard' },
  { tab: 'media', label: 'Media' },
  { tab: 'music', label: 'Music' },
  { tab: 'audience', label: 'Audience' },
  { tab: 'ideas', label: 'Ideas' },
];

const COLLAPSE_QUERY = '(max-width: 640px)';

// Replaces TabBar (desktop rail) and MobileNav (touch hamburger + full-screen
// panel) with one fixed glass pill that floats over every page at every
// breakpoint — just the five section names, nothing else (logout now lives
// in Header's profile menu instead). A white puck sits behind the active
// tab at rest and glides to preview whichever tab the pointer is currently
// over — a plain hover, no click-and-drag — snapping back the moment the
// pointer leaves; a normal click on a Link is what actually navigates. Once
// the pill is too narrow to hold all five labels legibly, it collapses to
// just the current tab + a Menu trigger that unfurls the rest above it,
// rather than shrinking text past reading size.
export default function FloatingTabNav() {
  const router = useRouter();
  const activeIndex = Math.max(0, NAV_TABS.findIndex(({ tab }) => router.pathname === `/${tab}`));

  const navRef = useGlassSurface();
  const unfurlPanelRef = useGlassSurface();
  const trackRef = useRef(null);
  const puckRef = useRef(null);
  const linkRefs = useRef([]);
  const unfurlRef = useRef(null);
  const menuBtnRef = useRef(null);

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hoveringRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(COLLAPSE_QUERY);
    function sync() {
      setCollapsed(mq.matches);
    }
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (collapsed) return undefined;
    function handleRouteChange() {
      setMenuOpen(false);
    }
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [collapsed, router]);

  function movePuckTo(index, instant) {
    const track = trackRef.current;
    const puck = puckRef.current;
    const el = linkRefs.current[index];
    if (!track || !puck || !el) return;
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (instant) puck.style.transition = 'none';
    puck.style.width = `${elRect.width}px`;
    puck.style.transform = `translateX(${elRect.left - trackRect.left}px)`;
    if (instant) {
      // eslint-disable-next-line no-unused-expressions
      puck.getBoundingClientRect();
      puck.style.transition = '';
    }
  }

  useEffect(() => {
    if (collapsed) return undefined;
    movePuckTo(activeIndex, true);
    function onResize() {
      if (!hoveringRef.current) movePuckTo(activeIndex, true);
    }
    window.addEventListener('resize', onResize);
    // Archivo Black may still be loading at mount, in which case the active
    // link's own measured width (and font fallback metrics) are briefly
    // wrong — re-measure once the real font has actually swapped in.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) movePuckTo(activeIndex, true);
    });
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, activeIndex]);

  // Close the unfurl menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDocPointerDown(e) {
      if (unfurlRef.current?.contains(e.target) || menuBtnRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Pure hover preview: whichever tab the pointer is currently above gets
  // the puck glided under it. No drag, no pointer capture — just track which
  // link element the pointer is over and glide there; leaving the row snaps
  // the puck back to the actual active tab.
  function handleTrackPointerMove(e) {
    const index = linkRefs.current.findIndex((el) => el?.contains(e.target));
    if (index === -1) return;
    hoveringRef.current = true;
    movePuckTo(index);
  }

  function handleTrackPointerLeave() {
    hoveringRef.current = false;
    movePuckTo(activeIndex);
  }

  const current = NAV_TABS[activeIndex];
  const otherTabs = NAV_TABS.filter((_, i) => i !== activeIndex);

  return (
    <nav className="floatnav glass" aria-label="Primary" ref={navRef}>
      {collapsed ? (
        <>
          <span className="floatnav__current">{current.label}</span>
          <button
            type="button"
            className="floatnav__menu-btn"
            ref={menuBtnRef}
            aria-expanded={menuOpen}
            aria-controls="floatnav-unfurl"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menu
            <span className="floatnav__menu-glyph" aria-hidden="true">+</span>
          </button>
          <div className="floatnav__unfurl" id="floatnav-unfurl" data-open={menuOpen} ref={unfurlRef}>
            <div className="floatnav__unfurl-inner">
              <div className="floatnav__unfurl-panel glass" ref={unfurlPanelRef}>
                {otherTabs.map(({ tab, label }) => (
                  <Link key={tab} href={`/${tab}`} className="floatnav__unfurl-link" onClick={() => setMenuOpen(false)}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          className="floatnav__items"
          ref={trackRef}
          onPointerMove={handleTrackPointerMove}
          onPointerLeave={handleTrackPointerLeave}
        >
          <div className="floatnav__puck" ref={puckRef} aria-hidden="true" />
          {NAV_TABS.map(({ tab, label }, i) => {
            const href = `/${tab}`;
            const active = i === activeIndex;
            return (
              <Link
                key={tab}
                href={href}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                className="floatnav__link"
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
