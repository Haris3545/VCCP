import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { PAGE_TRANSITION_EVENT } from '@/lib/pageTransition';

// Solid-paper circular reveal that expands from a trigger point (the button
// that was clicked), stays covered through the Next.js route change, then
// fades away once the new page has mounted underneath it.
export default function PageTransitionOverlay() {
  const router = useRouter();
  const [state, setState] = useState({ active: false, closing: false, x: 0, y: 0 });
  const overlayRef = useRef(null);

  useEffect(() => {
    function handleStart(e) {
      const { x, y } = e.detail || {};
      const cx = typeof x === 'number' ? x : window.innerWidth / 2;
      const cy = typeof y === 'number' ? y : window.innerHeight / 2;
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
      setState((s) => (s.active ? { ...s, closing: true } : s));
    }
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);
    return () => {
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
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
