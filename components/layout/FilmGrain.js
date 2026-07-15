import { useEffect, useRef } from 'react';

// Animated noise, redrawn on a canvas a few times a second — distinct from
// GrainOverlay's static SVG texture. Used where the flicker itself is the point.
export default function FilmGrain({ opacity = 0.16 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (reduce || !canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let w, h, imageData, buf32, raf;
    let last = 0;

    function resize() {
      w = canvas.width = Math.floor(window.innerWidth / 2);
      h = canvas.height = Math.floor(window.innerHeight / 2);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      imageData = ctx.createImageData(w, h);
      buf32 = new Uint32Array(imageData.data.buffer);
    }
    resize();
    window.addEventListener('resize', resize);

    function frame(t) {
      if (t - last > 55) {
        last = t;
        for (let i = 0; i < buf32.length; i++) {
          const v = (Math.random() * 255) | 0;
          buf32[i] = ((Math.random() < 0.5 ? 255 : 0) << 24) | (v << 16) | (v << 8) | v;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="film-grain" style={{ opacity }} aria-hidden="true" />;
}
