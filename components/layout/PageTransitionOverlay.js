import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { PAGE_TRANSITION_EVENT, setPageTransitionCovering, notifyPageTransitionGrown } from '@/lib/pageTransition';

// A brief hold once the destination page has mounted underneath the fully-
// grown circle, before the reveal starts fading away. The page swap itself
// happens only after the circle has fully covered the screen (callers await
// startPageTransition's promise before navigating — see lib/pageTransition),
// so this isn't standing in for the grow animation anymore; it's just a
// beat to let the new page's first paint settle before uncovering it.
const POST_NAV_SETTLE_MS = 220;

// Solid-paper circular reveal that expands from a trigger point (the button
// that was clicked), stays covered through the Next.js route change, then
// fades away once the new page has mounted underneath it.
export default function PageTransitionOverlay() {
  const router = useRouter();
  const [state, setState] = useState({ id: 0, active: false, closing: false, x: 0, y: 0 });
  const overlayRef = useRef(null);
  // null whenever no transition is in flight. Doubles as the guard in
  // handleDone below — without it, a routeChangeComplete from an unrelated
  // navigation (e.g. the logout redirect, which never called
  // startPageTransition) reads this stale timestamp from the *previous*
  // transition, computes an elapsed time already past the settle floor, and
  // schedules a same-tick "start closing" timer for a transition that isn't
  // even running.
  const startTimeRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const nextIdRef = useRef(1);
  // Closing needs BOTH of these true. In practice growDoneRef is already
  // true by the time closeRequestedRef can become true, since the page swap
  // (and therefore routeChangeComplete) only happens after the caller's
  // startPageTransition promise — resolved via notifyPageTransitionGrown
  // below — has already fired. Kept as a pair anyway as a defensive floor:
  // closing should never be able to start before the circle has visibly
  // finished covering the screen, regardless of how it got triggered.
  const growDoneRef = useRef(false);
  const closeRequestedRef = useRef(false);

  function closeIfReady() {
    if (closeRequestedRef.current && growDoneRef.current) {
      // The circle is about to start uncovering the screen — release page
      // content's entrance animation now so it visibly cross-dissolves with
      // the fade instead of having already finished underneath it.
      setPageTransitionCovering(false);
      setState((s) => (s.active ? { ...s, closing: true } : s));
    }
  }

  useEffect(() => {
    function handleStart(e) {
      const { x, y, id } = e.detail || {};
      const cx = typeof x === 'number' ? x : window.innerWidth / 2;
      const cy = typeof y === 'number' ? y : window.innerHeight / 2;
      startTimeRef.current = performance.now();
      growDoneRef.current = false;
      closeRequestedRef.current = false;
      setPageTransitionCovering(true);
      // The id comes from startPageTransition's caller so that notifying it
      // once the circle has fully grown (below) resolves the *right*
      // caller's promise. It doubles as the `key` below, forcing React to
      // mount a brand new overlay node instead of mutating the previous one
      // in place — that matters when a login happens again quickly after a
      // logout: the prior overlay may still be mid fade-out, with its own
      // inline transition/clip-path state. Reusing that node and
      // force-resetting its style back to a pinhole produces a visible
      // flash instead of a clean reveal; a new node just starts fresh at
      // CSS defaults.
      const transitionId = typeof id === 'number' ? id : nextIdRef.current++;
      setState({ id: transitionId, active: true, closing: false, x: cx, y: cy });
    }
    window.addEventListener(PAGE_TRANSITION_EVENT, handleStart);
    return () => window.removeEventListener(PAGE_TRANSITION_EVENT, handleStart);
  }, []);

  useEffect(() => {
    if (!state.active || state.closing) return undefined;
    const el = overlayRef.current;
    if (!el) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxX = Math.max(state.x, window.innerWidth - state.x);
    const maxY = Math.max(state.y, window.innerHeight - state.y);
    const radius = Math.hypot(maxX, maxY);

    if (reduce) {
      el.style.transition = 'none';
      el.style.clipPath = `circle(${radius}px at ${state.x}px ${state.y}px)`;
      growDoneRef.current = true;
      notifyPageTransitionGrown(state.id);
      closeIfReady();
      return undefined;
    }

    el.style.transition = 'none';
    el.style.clipPath = `circle(0px at ${state.x}px ${state.y}px)`;
    // force reflow so the 0px state commits before the transition is armed
    el.getBoundingClientRect();

    function handleTransitionEnd(e) {
      if (e.target !== el || e.propertyName !== 'clip-path') return;
      growDoneRef.current = true;
      notifyPageTransitionGrown(state.id);
      closeIfReady();
    }
    el.addEventListener('transitionend', handleTransitionEnd);

    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.clipPath = `circle(${radius}px at ${state.x}px ${state.y}px)`;
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      el.removeEventListener('transitionend', handleTransitionEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.id, state.active, state.closing, state.x, state.y]);

  useEffect(() => {
    // router.events is a stable singleton for the app's lifetime even though
    // the `router` object itself gets a new identity on every navigation —
    // depending on [router] here would re-subscribe on each route change,
    // and that re-subscription's cleanup would cancel the close timeout
    // below moments after scheduling it, so the overlay would arm the fade
    // but never actually run it.
    function handleDone() {
      // No transition in flight — this routeChangeComplete belongs to some
      // other navigation (e.g. the logout redirect) that never started a
      // transition. Ignore it rather than scheduling off a stale
      // startTimeRef left over from the last real transition.
      if (startTimeRef.current == null) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wait = reduce ? 0 : POST_NAV_SETTLE_MS;
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        closeRequestedRef.current = true;
        closeIfReady();
      }, wait);
    }
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);
    return () => {
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
      clearTimeout(closeTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.closing) return undefined;
    const timeout = setTimeout(() => {
      startTimeRef.current = null;
      setState((s) => ({ ...s, active: false, closing: false }));
    }, 550);
    return () => clearTimeout(timeout);
  }, [state.id, state.closing]);

  if (!state.active) return null;

  return (
    <div
      key={state.id}
      ref={overlayRef}
      className={`page-transition${state.closing ? ' page-transition--closing' : ''}`}
      aria-hidden="true"
    />
  );
}
