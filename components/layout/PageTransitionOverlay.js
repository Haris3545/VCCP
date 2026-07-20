import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { PAGE_TRANSITION_EVENT, setPageTransitionCovering } from '@/lib/pageTransition';

// Must match .page-transition's `transition: clip-path 900ms` in globals.css —
// this is the MINIMUM the reveal stays covered for before it's allowed to
// start fading. It's a floor, not the real signal: the actual close also
// waits for the grow animation's own `transitionend` (see growDoneRef
// below), so a route change that resolves faster than the grow animation
// never jumps straight to the opacity fade before the circle has visibly
// finished covering the screen.
const MIN_COVER_MS = 900;

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
  // transition, computes an elapsed time already past MIN_COVER_MS, and
  // schedules a same-tick "start closing" timer for a transition that isn't
  // even running.
  const startTimeRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const nextIdRef = useRef(1);
  // Closing needs BOTH of these true. MIN_COVER_MS is a wall-clock timer
  // that assumes the grow transition finishes in exactly 900ms, but the
  // double-rAF below only *starts* that CSS transition a couple of frames
  // after the timer begins — under load (e.g. right after a logout, while
  // the browser is still busy tearing down/mounting the page) those frames
  // can slip enough that the timer fires before the circle has actually
  // finished covering the screen. Gating on the real transitionend as well
  // means closing never starts before the circle is visibly complete.
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
      const { x, y } = e.detail || {};
      const cx = typeof x === 'number' ? x : window.innerWidth / 2;
      const cy = typeof y === 'number' ? y : window.innerHeight / 2;
      startTimeRef.current = performance.now();
      growDoneRef.current = false;
      closeRequestedRef.current = false;
      setPageTransitionCovering(true);
      // A fresh id forces React to mount a brand new overlay node (via the
      // `key` below) instead of mutating the previous one in place. That
      // matters when a login happens again quickly after a logout: the
      // prior overlay may still be mid fade-out, with its own inline
      // transition/clip-path state. Reusing that node and force-resetting
      // its style back to a pinhole produces a visible flash instead of a
      // clean reveal; a new node just starts fresh at CSS defaults.
      setState({ id: nextIdRef.current++, active: true, closing: false, x: cx, y: cy });
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
      const elapsed = performance.now() - startTimeRef.current;
      const wait = reduce ? 0 : Math.max(0, MIN_COVER_MS - elapsed);
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
