import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { PAGE_TRANSITION_EVENT } from '@/lib/pageTransition';

// Must match .page-transition's `transition: clip-path 900ms` in globals.css —
// this is how long the reveal needs to finish growing before it's allowed to
// start fading. Without this floor, a route change that resolves faster than
// the grow animation (e.g. navigating to a page Next.js already has cached
// client-side, which finishes in well under 900ms) fires routeChangeComplete
// while the circle is still just a few px wide, cancels the grow rAF, and
// jumps straight to the opacity fade — the reveal never visibly plays.
const MIN_COVER_MS = 900;

// Solid-paper circular reveal that expands from a trigger point (the button
// that was clicked), stays covered through the Next.js route change, then
// fades away once the new page has mounted underneath it.
export default function PageTransitionOverlay() {
  const router = useRouter();
  const [state, setState] = useState({ active: false, closing: false, x: 0, y: 0 });
  const overlayRef = useRef(null);
  const startTimeRef = useRef(0);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    function handleStart(e) {
      const { x, y } = e.detail || {};
      const cx = typeof x === 'number' ? x : window.innerWidth / 2;
      const cy = typeof y === 'number' ? y : window.innerHeight / 2;
      startTimeRef.current = performance.now();
      setState({ active: true, closing: false, x: cx, y: cy });
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
      return undefined;
    }

    el.style.transition = 'none';
    el.style.clipPath = `circle(0px at ${state.x}px ${state.y}px)`;
    // force reflow so the 0px state commits before the transition is armed
    el.getBoundingClientRect();

    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.clipPath = `circle(${radius}px at ${state.x}px ${state.y}px)`;
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, [state.active, state.closing, state.x, state.y]);

  useEffect(() => {
    function handleDone() {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const elapsed = performance.now() - startTimeRef.current;
      const wait = reduce ? 0 : Math.max(0, MIN_COVER_MS - elapsed);
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setState((s) => (s.active ? { ...s, closing: true } : s));
      }, wait);
    }
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);
    return () => {
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
      clearTimeout(closeTimeoutRef.current);
    };
  }, [router]);

  useEffect(() => {
    if (!state.closing) return undefined;
    const timeout = setTimeout(() => {
      setState({ active: false, closing: false, x: 0, y: 0 });
    }, 550);
    return () => clearTimeout(timeout);
  }, [state.closing]);

  if (!state.active) return null;

  return (
    <div
      ref={overlayRef}
      className={`page-transition${state.closing ? ' page-transition--closing' : ''}`}
      aria-hidden="true"
    />
  );
}
