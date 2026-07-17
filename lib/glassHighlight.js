// Drives the --gx/--gy custom properties the .glass utility's specular
// highlight is positioned at (see globals.css). Pointer movement over the
// element moves the highlight directly; a slow scroll-linked drift keeps it
// alive even when nothing's hovering, so the glass never looks static. This
// is a stand-in for real content-sampling (which would need to read pixels
// out of the DOM behind the element) — not literal adaptive tinting, just
// enough motion that the surface reads as reactive rather than a flat blur.
export function attachGlassHighlight(el) {
  if (!el || typeof window === 'undefined') return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  function setPos(xPct, yPct) {
    el.style.setProperty('--gx', `${xPct}%`);
    el.style.setProperty('--gy', `${yPct}%`);
  }

  function onPointerMove(e) {
    const r = el.getBoundingClientRect();
    setPos(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  }
  function onPointerLeave() {
    setPos(30, 20);
  }
  function onScroll() {
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
