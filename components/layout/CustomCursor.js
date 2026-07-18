import { useEffect, useRef } from 'react';

// A small circle that tracks the pointer, painted with mix-blend-mode:
// difference against whatever's underneath. Difference is computed per
// pixel, so a solid white dot inverts to black over light content and stays
// white over dark content automatically — no per-element theming needed,
// and it splits cleanly down the middle over a half-light/half-dark edge
// for free, since each half of the circle is a different underlying pixel.
export default function CustomCursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isCoarsePointer) return undefined;

    const dot = dotRef.current;
    if (!dot) return undefined;

    document.documentElement.classList.add('custom-cursor-active');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let visible = false;

    function place() {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }

    function onMove(e) {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
      }
      if (reduce) {
        place();
      }
    }
    function onLeave() {
      visible = false;
      dot.style.opacity = '0';
    }
    function onDown() {
      dot.classList.add('custom-cursor--down');
    }
    function onUp() {
      dot.classList.remove('custom-cursor--down');
    }

    let raf;
    function frame() {
      place();
      raf = requestAnimationFrame(frame);
    }
    if (!reduce) raf = requestAnimationFrame(frame);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <div className="custom-cursor" ref={dotRef} aria-hidden="true" />;
}
