// Fires a circular reveal that PageTransitionOverlay (mounted once in _app.js,
// so it survives the route change) picks up. Kept as a plain DOM event rather
// than React context so callers don't need the overlay in their tree.
const EVENT_NAME = 'studio:transition-start';
const GROWN_EVENT_NAME = 'studio:transition-grown';
let nextTransitionId = 1;

// Starts the circular reveal and resolves once the circle has fully grown
// to cover the screen (see PageTransitionOverlay's notifyPageTransitionGrown
// call). Callers should hold off swapping the page underneath until this
// resolves — otherwise the swap happens while the circle is still only
// partway open, and the new page flashes into view before the reveal has
// actually covered it.
export function startPageTransition(x, y) {
  if (typeof window === 'undefined') return Promise.resolve();
  const id = nextTransitionId++;
  return new Promise((resolve) => {
    function handleGrown(e) {
      if (e.detail?.id !== id) return;
      window.removeEventListener(GROWN_EVENT_NAME, handleGrown);
      resolve();
    }
    window.addEventListener(GROWN_EVENT_NAME, handleGrown);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id, x, y } }));
  });
}

export function notifyPageTransitionGrown(id) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GROWN_EVENT_NAME, { detail: { id } }));
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
