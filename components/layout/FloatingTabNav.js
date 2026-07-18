import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import artistConfig from '@/lib/artist.config';
import { STUDIO_NAME } from '@/lib/constants';
import { attachGlassHighlight } from '@/lib/glassHighlight';
import LogoutButton from './LogoutButton';

// Mirrors each page's own <h1> text exactly (see pages/*.js) — this is the
// only place that label has to be spelled out a second time, since deriving
// it from the slug can't reproduce irregular casing like "YouTube".
const TAB_LABELS = {
  dashboard: 'Dashboard',
  media: 'Media',
  'social-listening': 'Social listening',
  music: 'Music',
  youtube: 'YouTube',
  audience: 'Audience',
  strategy: 'Strategy',
  tactics: 'Tactics',
  locations: 'Locations',
  ideas: 'Ideas',
  calendar: 'Calendar',
  research: 'Research',
};

// Sourced from artistConfig.tabs (the single per-artist list of enabled
// tabs) rather than hardcoded, so the nav can never drift out of sync with
// which pages actually exist for this tier.
const NAV_TABS = artistConfig.tabs.map((tab) => ({ tab, label: TAB_LABELS[tab] || tab }));

const COLLAPSE_QUERY = '(max-width: 640px)';

// Replaces TabBar (desktop rail) and MobileNav (touch hamburger + full-screen
// panel) with one fixed glass pill that floats over every page at every
// breakpoint. A white puck slides behind the active tab and can be dragged
// by hand to any other one; once the pill is too narrow to hold all five
// labels legibly, it collapses to just the current tab + a Menu trigger that
// unfurls the rest above it, rather than shrinking text past reading size.
export default function FloatingTabNav() {
  const router = useRouter();
  const activeIndex = Math.max(0, NAV_TABS.findIndex(({ tab }) => router.pathname === `/${tab}`));

  const navRef = useRef(null);
  const trackRef = useRef(null);
  const puckRef = useRef(null);
  const linkRefs = useRef([]);
  const unfurlRef = useRef(null);
  const menuBtnRef = useRef(null);

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const suppressClickRef = useRef(false);
  const draggingRef = useRef(false);

  useEffect(() => attachGlassHighlight(navRef.current), []);

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
      movePuckTo(activeIndex, true);
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

  // The puck renders behind the active Link (z-index 0 vs 1) so its glass
  // stays visually under the label — which also means it's never the actual
  // pointerdown target; the covering Link always is. So the drag listener
  // lives on the track (an ancestor of both), and hit-tests the pointer
  // position against the puck's own rect before deciding to start a drag,
  // the same pattern the old ConsoleTabNav used for this exact problem.
  function withinPuck(x, y) {
    const puck = puckRef.current;
    if (!puck) return false;
    const r = puck.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function handleTrackPointerMove(e) {
    if (draggingRef.current) return;
    const track = trackRef.current;
    if (track) track.style.cursor = withinPuck(e.clientX, e.clientY) ? 'grab' : '';
  }

  function handleTrackPointerDown(e) {
    if (!withinPuck(e.clientX, e.clientY)) return;
    const track = trackRef.current;
    const puck = puckRef.current;
    if (!track || !puck) return;
    e.preventDefault();

    draggingRef.current = true;
    track.style.cursor = 'grabbing';
    const startX = e.clientX;
    const trackRect = track.getBoundingClientRect();
    const startLeft = puck.getBoundingClientRect().left - trackRect.left;
    puck.style.transition = 'none';

    function nearestIndexToCenter(centerX) {
      let nearest = 0;
      let nearestDist = Infinity;
      linkRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - centerX);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      });
      return nearest;
    }

    function onMove(ev) {
      if (Math.abs(ev.clientX - startX) > 4) suppressClickRef.current = true;
      const tRect = track.getBoundingClientRect();
      const puckWidth = puck.getBoundingClientRect().width;
      const dx = ev.clientX - startX;
      const minLeft = 0;
      const maxLeft = tRect.width - puckWidth;
      const newLeft = Math.min(maxLeft, Math.max(minLeft, startLeft + dx));
      puck.style.transform = `translateX(${newLeft}px)`;
    }

    function onUp(ev) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      draggingRef.current = false;
      track.style.cursor = '';
      puck.style.transition = '';
      const puckRect = puck.getBoundingClientRect();
      const nearest = nearestIndexToCenter(puckRect.left + puckRect.width / 2);
      movePuckTo(nearest);
      if (nearest !== activeIndex) {
        router.push(`/${NAV_TABS[nearest].tab}`);
      }
      ev.preventDefault();
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const current = NAV_TABS[activeIndex];
  const otherTabs = NAV_TABS.filter((_, i) => i !== activeIndex);

  return (
    <nav className="floatnav glass" aria-label="Primary" ref={navRef}>
      <Link href="/dashboard" className="floatnav__mark">
        <span className="floatnav__eq" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="floatnav__mark-text">{STUDIO_NAME}</span>
      </Link>

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
              {otherTabs.map(({ tab, label }) => (
                <Link key={tab} href={`/${tab}`} className="floatnav__unfurl-link" onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div
          className="floatnav__items"
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
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
                onClick={(e) => {
                  if (suppressClickRef.current) {
                    e.preventDefault();
                    suppressClickRef.current = false;
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <LogoutButton className="floatnav__logout" />
    </nav>
  );
}
