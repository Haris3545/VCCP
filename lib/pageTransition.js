// Fires a circular reveal that PageTransitionOverlay (mounted once in _app.js,
// so it survives the route change) picks up. Kept as a plain DOM event rather
// than React context so callers don't need the overlay in their tree.
const EVENT_NAME = 'studio:transition-start';

export function startPageTransition(x, y) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { x, y } }));
}

export const PAGE_TRANSITION_EVENT = EVENT_NAME;

// Lets page content (AppShell) know whether the circle-reveal overlay is
// still covering the screen. The destination page mounts underneath the
// overlay well before it starts fading, so a content entrance animation
// that just plays on mount finishes while fully hidden and is never seen —
// this lets that animation wait until the circle actually starts to reveal
// it, so the two visibly cross-dissolve together.
let covering = false;
const coveringListeners = new Set();

export function setPageTransitionCovering(value) {
  if (covering === value) return;
  covering = value;
  coveringListeners.forEach((listener) => listener(value));
}

export function isPageTransitionCovering() {
  return covering;
}

export function subscribePageTransitionCovering(listener) {
  coveringListeners.add(listener);
  return () => coveringListeners.delete(listener);
}
