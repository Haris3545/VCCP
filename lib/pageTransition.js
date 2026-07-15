// Fires a circular reveal that PageTransitionOverlay (mounted once in _app.js,
// so it survives the route change) picks up. Kept as a plain DOM event rather
// than React context so callers don't need the overlay in their tree.
const EVENT_NAME = 'studio:transition-start';

export function startPageTransition(x, y) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { x, y } }));
}

export const PAGE_TRANSITION_EVENT = EVENT_NAME;
