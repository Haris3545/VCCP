// Drives the --gx/--gy custom properties the .glass utility's specular
// highlight is positioned at (see globals.css, registered there via
// @property so they're actually animatable). Live pointer tracking stays
// instant — 1:1 with the cursor, no lag — but the moment the pointer
// leaves, .is-resetting arms a transition on those properties so the
// highlight glides back to its resting position instead of snapping; the
// next pointermove disarms it immediately so tracking never feels eased.
// A slow scroll-linked drift keeps the glass alive even when nothing's
// hovering. This is a stand-in for real content-sampling (which would need
// to read pixels out of the DOM behind the element) — not literal adaptive
// tinting, just enough motion that the surface reads as reactive.
export function attachGlassHighlight(el) {
  if (!el || typeof window === 'undefined') return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  function setPos(xPct, yPct) {
    el.style.setProperty('--gx', `${xPct}%`);
    el.style.setProperty('--gy', `${yPct}%`);
  }

  function onPointerMove(e) {
    el.classList.remove('is-resetting');
    const r = el.getBoundingClientRect();
    setPos(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  }
  function onPointerLeave() {
    el.classList.add('is-resetting');
    setPos(30, 20);
  }
  function onScroll() {
    el.classList.add('is-resetting');
    setPos(30 + Math.sin(window.scrollY / 260) * 18, 20 + Math.cos(window.scrollY / 220) * 14);
  }

  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return () => {
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('scroll', onScroll);
  };
}
