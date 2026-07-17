import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import artistConfig from '@/lib/artist.config';

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

// Standard, recognisable abbreviations for a genuinely narrow window - a
// consistent 3-letter style, with a couple of natural exceptions (YT is
// instantly recognisable; DASH reads better than a clipped "DAS"). All
// distinct from one another.
const TAB_SHORT = {
  dashboard: 'DASH',
  media: 'MED',
  'social-listening': 'SOC',
  music: 'MUS',
  youtube: 'YT',
  audience: 'AUD',
  strategy: 'STR',
  tactics: 'TAC',
  locations: 'LOC',
  ideas: 'IDE',
  calendar: 'CAL',
  research: 'RES',
};

const FAST_THRESHOLD_MS = 170;
const SMEAR_TRAIL = 30; // a short, fixed stretch - not tied to travel distance
// Full words stay on even fairly small - this only drops to abbreviations
// for a genuinely narrow window, not an ordinarily-resized one.
const MIN_FULL_FONT = 4;

// Desktop-only replacement for the plain pill-row TabNav: a slim rail with
// a sliding "fader puck" behind the active label, draggable by hand, and
// arrow-key navigable with a short comet-tail smear on fast moves. The
// mobile full-screen panel keeps using the original TabNav unchanged - a
// horizontally-sliding puck doesn't translate to that vertical list, and
// there was never a legibility/space problem there to begin with.
export default function ConsoleTabNav() {
  const router = useRouter();
  const tabs = artistConfig.tabs;

  const railRef = useRef(null);
  const puckRef = useRef(null);
  const btnRefs = useRef([]);

  const routeIndex = Math.max(0, tabs.findIndex((t) => router.pathname === `/${t}`));

  const [dragPreviewIndex, setDragPreviewIndex] = useState(null);
  const [optimisticIndex, setOptimisticIndex] = useState(null);
  const [shortMode, setShortMode] = useState(false);

  const activeIndex = dragPreviewIndex ?? optimisticIndex ?? routeIndex;

  const intendedIndexRef = useRef(routeIndex);
  const prevActiveIndexRef = useRef(activeIndex);
  const fastFlagRef = useRef(false);
  const lastMoveTimeRef = useRef(0);
  const settleTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const shortModeThresholdRef = useRef(null);

  // Real navigation (a click, or the browser's own back/forward) is always
  // authoritative once it lands - hand control back from any optimistic
  // preview to whatever the router says.
  useEffect(() => {
    intendedIndexRef.current = routeIndex;
    setOptimisticIndex(null);
  }, [routeIndex]);

  function movePuck(el) {
    const rail = railRef.current;
    const puck = puckRef.current;
    if (!rail || !puck || !el) return;
    const railRect = rail.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    puck.style.width = `${elRect.width}px`;
    puck.style.transform = `translateX(${elRect.left - railRect.left - 4}px)`;
  }

  function applySmear(prevIndex, nextIndex) {
    const rail = railRef.current;
    const puck = puckRef.current;
    const nextEl = btnRefs.current[nextIndex];
    if (!rail || !puck || !nextEl) return;
    const railRect = rail.getBoundingClientRect();
    const nextRect = nextEl.getBoundingClientRect();
    const movingRight = nextIndex > prevIndex;
    let left = nextRect.left - railRect.left - 4;
    let right = nextRect.right - railRect.left - 4;
    if (movingRight) left -= SMEAR_TRAIL;
    else right += SMEAR_TRAIL;

    puck.classList.add('tab-nav__puck--fast');
    puck.style.transform = `translateX(${left}px)`;
    puck.style.width = `${right - left}px`;

    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      puck.classList.remove('tab-nav__puck--fast');
      movePuck(nextEl);
    }, 120);
  }

  // Animate the puck whenever the effective active tab changes - from a
  // route change (click, back/forward), a drag preview, or a keyboard step.
  useEffect(() => {
    const el = btnRefs.current[activeIndex];
    if (!el) return;
    const prevIndex = prevActiveIndexRef.current;
    const now = performance.now();
    const fast = fastFlagRef.current && prevIndex !== activeIndex && now - lastMoveTimeRef.current < FAST_THRESHOLD_MS;
    lastMoveTimeRef.current = now;
    fastFlagRef.current = false;

    if (fast) {
      applySmear(prevIndex, activeIndex);
    } else {
      clearTimeout(settleTimerRef.current);
      puckRef.current?.classList.remove('tab-nav__puck--fast');
      movePuck(el);
    }
    prevActiveIndexRef.current = activeIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Arrow keys navigate anywhere on the page. Clicking a link doesn't
  // reliably move focus to it in every browser, so a page-level listener
  // plus the tracked index is far more reliable than per-link focus-scoped
  // handlers. Only one ConsoleTabNav instance ever exists (desktop only),
  // so there's no risk of two listeners double-handling the same press.
  useEffect(() => {
    function handleKeydown(e) {
      if (dragPreviewIndex !== null) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = Math.max(0, Math.min(tabs.length - 1, intendedIndexRef.current + dir));
      if (next === intendedIndexRef.current) return;
      intendedIndexRef.current = next;
      fastFlagRef.current = true;
      setOptimisticIndex(next);
      router.push(`/${tabs[next]}`);
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [dragPreviewIndex, router, tabs]);

  // Drag the puck directly. The links sit visually on top of it (so their
  // full click targets keep working everywhere), so dragging is detected
  // by comparing pointerdown coordinates against the puck's own current
  // rect rather than listening on the puck element itself - and the
  // link's own click right after a drag-release is swallowed once via
  // suppressClickRef, since it would otherwise re-navigate to wherever
  // the pointer originally went down.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let dragging = false;
    let dragStartX = 0;
    let puckStartLeft = 0;
    let dragBaseWidth = 0;
    let lastDragX = 0;
    let lastDragTime = 0;

    function withinPuck(x, y) {
      const puck = puckRef.current;
      if (!puck) return false;
      const r = puck.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    function nearestIndexToX(centerX) {
      let nearest = 0;
      let nearestDist = Infinity;
      btnRefs.current.forEach((btn, i) => {
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - centerX);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      });
      return nearest;
    }

    function handlePointerDown(e) {
      if (!withinPuck(e.clientX, e.clientY)) return;
      dragging = true;
      suppressClickRef.current = true;
      setDragPreviewIndex(activeIndex);
      clearTimeout(settleTimerRef.current);
      const puck = puckRef.current;
      puck.classList.remove('tab-nav__puck--fast');
      puck.classList.add('tab-nav__puck--dragging');
      try {
        rail.setPointerCapture(e.pointerId);
      } catch (err) {
        // Pointer capture isn't available in every environment - dragging
        // still works via the window-level listeners below either way.
      }
      const railRect = rail.getBoundingClientRect();
      const puckRect = puck.getBoundingClientRect();
      dragStartX = e.clientX;
      puckStartLeft = puckRect.left - railRect.left;
      dragBaseWidth = puckRect.width;
      lastDragX = e.clientX;
      lastDragTime = performance.now();
      e.preventDefault();
    }

    function handlePointerMove(e) {
      if (!dragging) {
        rail.style.cursor = withinPuck(e.clientX, e.clientY) ? 'grab' : '';
        return;
      }
      const puck = puckRef.current;
      const now = performance.now();
      const dt = Math.max(1, now - lastDragTime);
      const stepDx = e.clientX - lastDragX;
      const velocity = Math.abs(stepDx) / dt;

      const railRect = rail.getBoundingClientRect();
      const dx = e.clientX - dragStartX;
      const minLeft = 4;
      const maxLeft = railRect.width - 4 - dragBaseWidth;
      const newLeft = Math.min(maxLeft, Math.max(minLeft, puckStartLeft + dx));

      const trail = Math.min(SMEAR_TRAIL, velocity * 40);
      if (trail > 2) {
        puck.style.transform = `translateX(${stepDx >= 0 ? newLeft - trail : newLeft}px)`;
        puck.style.width = `${dragBaseWidth + trail}px`;
      } else {
        puck.style.transform = `translateX(${newLeft}px)`;
        puck.style.width = `${dragBaseWidth}px`;
      }

      const coreCenter = railRect.left + newLeft + dragBaseWidth / 2;
      const nearest = nearestIndexToX(coreCenter);
      setDragPreviewIndex((prev) => (prev === nearest ? prev : nearest));

      lastDragX = e.clientX;
      lastDragTime = now;
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      const puck = puckRef.current;
      puck?.classList.remove('tab-nav__puck--dragging');
      const r = puck.getBoundingClientRect();
      const finalIndex = nearestIndexToX(r.left + r.width / 2);
      setDragPreviewIndex(null);
      setOptimisticIndex(finalIndex);
      intendedIndexRef.current = finalIndex;
      router.push(`/${tabs[finalIndex]}`);
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    rail.addEventListener('pointerdown', handlePointerDown);
    rail.addEventListener('pointermove', handlePointerMove);
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    return () => {
      rail.removeEventListener('pointerdown', handlePointerDown);
      rail.removeEventListener('pointermove', handlePointerMove);
      rail.removeEventListener('pointerup', endDrag);
      rail.removeEventListener('pointercancel', endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, tabs]);

  // Fits one shared font size to the available width - full labels while
  // they can stay comfortably legible, or short abbreviations once the
  // rail is genuinely narrow (not just an ordinarily-resized window).
  // Switching modes triggers a React re-render (real text content, so it
  // survives later re-renders from route/drag state changes rather than
  // being clobbered), then this effect re-measures once that's landed.
  // A little hysteresis on the switch-back-to-full width avoids flicker
  // right at the boundary.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    function measure(ceiling) {
      const cs = getComputedStyle(rail);
      const avail = rail.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const gap = parseFloat(cs.gap) || 0;
      let size = ceiling;
      for (let pass = 0; pass < 8; pass++) {
        rail.style.setProperty('--tab-font', `${size}px`);
        let natural = gap * (btnRefs.current.length - 1);
        btnRefs.current.forEach((btn) => {
          if (btn) natural += btn.getBoundingClientRect().width;
        });
        const scale = avail / natural;
        size = Math.min(ceiling, size * scale * 0.994);
      }
      return size;
    }

    function fit() {
      if (!railRef.current) return;
      const size = measure(shortMode ? 24 : 16);

      if (!shortMode && size < MIN_FULL_FONT) {
        shortModeThresholdRef.current = rail.clientWidth;
        setShortMode(true);
        return;
      }
      if (shortMode && shortModeThresholdRef.current !== null && rail.clientWidth > shortModeThresholdRef.current * 1.05) {
        setShortMode(false);
        return;
      }

      rail.style.setProperty('--tab-font', `${size}px`);
      movePuck(btnRefs.current[activeIndex]);
    }

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortMode, activeIndex]);

  return (
    <nav className="tab-nav tab-nav--console" ref={railRef} aria-label="Primary">
      <div className="tab-nav__puck" ref={puckRef} />
      {tabs.map((tab, i) => {
        const href = `/${tab}`;
        const active = i === activeIndex;
        return (
          <Link
            key={tab}
            href={href}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            className={`tab-nav__link${active ? ' tab-nav__link--active' : ''}`}
            aria-current={active ? 'page' : undefined}
            title={TAB_LABELS[tab]}
            onClick={(e) => {
              if (suppressClickRef.current) {
                e.preventDefault();
                suppressClickRef.current = false;
              }
            }}
          >
            {shortMode ? TAB_SHORT[tab] : TAB_LABELS[tab]}
          </Link>
        );
      })}
    </nav>
  );
}
