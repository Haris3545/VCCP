import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import TabNav from './TabNav';
import LogoutButton from './LogoutButton';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const panel = panelRef.current;
    const btn = btnRef.current;
    if (!panel || !btn) return undefined;

    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (open) {
      document.body.style.overflow = 'hidden';
      panel.classList.add('is-open');

      if (reduce) {
        panel.style.transition = 'none';
        panel.style.clipPath = 'circle(150% at 50% 50%)';
        return undefined;
      }

      const maxX = Math.max(cx, window.innerWidth - cx);
      const maxY = Math.max(cy, window.innerHeight - cy);
      const radius = Math.hypot(maxX, maxY);

      panel.style.transition = 'none';
      panel.style.clipPath = `circle(0px at ${cx}px ${cy}px)`;
      panel.getBoundingClientRect();

      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.style.transition = '';
          panel.style.clipPath = `circle(${radius}px at ${cx}px ${cy}px)`;
        });
      });
      return () => cancelAnimationFrame(raf);
    }

    document.body.style.overflow = '';
    panel.style.transition = reduce ? 'none' : '';
    panel.style.clipPath = `circle(0px at ${cx}px ${cy}px)`;
    const timeout = setTimeout(() => panel.classList.remove('is-open'), reduce ? 0 : 550);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    function handleRouteChange() {
      setOpen(false);
    }
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`hamburger${open ? ' is-open' : ''}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="mobile-nav-panel" ref={panelRef} aria-hidden={!open}>
        <TabNav />
        <LogoutButton />
      </div>
    </>
  );
}
