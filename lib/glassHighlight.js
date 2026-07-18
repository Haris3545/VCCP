// Drives the custom properties the .glass utility's specular highlight and
// cursor-glow are positioned at (see globals.css, registered there via
// @property so they're actually animatable). Live pointer tracking stays
// instant — 1:1 with the cursor, no lag — but the moment the pointer
// leaves, .is-resetting arms a transition on those properties so everything
// glides back to rest instead of snapping; the next pointermove disarms it
// immediately so tracking never feels eased.
//
// --gx/--gy (percentages) position the internal highlight/colour blooms.
// --glow-x/--glow-y (pixel offsets from the element's centre) drive an outer
// box-shadow "glow" that spills past the glass's own edges — light escaping
// the surface, not just a highlight painted inside it.
//
// A slow scroll-linked drift keeps the glass alive even when nothing's
// hovering.
const MAX_GLOW_OFFSET = 26;

export function attachGlassHighlight(el) {
  if (!el || typeof window === 'undefined') return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  function setPos(xPct, yPct) {
    el.style.setProperty('--gx', `${xPct}%`);
    el.style.setProperty('--gy', `${yPct}%`);
  }
  function setGlow(x, y) {
    el.style.setProperty('--glow-x', `${x}px`);
    el.style.setProperty('--glow-y', `${y}px`);
  }

  function onPointerMove(e) {
    el.classList.remove('is-resetting');
    const r = el.getBoundingClientRect();
    setPos(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setGlow(
      Math.max(-MAX_GLOW_OFFSET, Math.min(MAX_GLOW_OFFSET, dx * 0.3)),
      Math.max(-MAX_GLOW_OFFSET, Math.min(MAX_GLOW_OFFSET, dy * 0.3)),
    );
  }
  function onPointerLeave() {
    el.classList.add('is-resetting');
    setPos(30, 20);
    setGlow(0, 0);
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
