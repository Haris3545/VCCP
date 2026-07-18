import { useEffect, useRef } from 'react';
import { useGlassSurface } from '@/lib/useGlassSurface';

// Decorative, always-on strip. Explicitly labelled SIMULATED — nothing here
// should ever be mistaken for a live feed by someone in the room.
const ITEMS = [
  { label: 'Cultural Buzz Score', value: '87/100', delta: '+4.2' },
  { label: 'Streaming Momentum', value: '112 idx', delta: '+6.8' },
  { label: 'Social Sentiment', value: '74% pos.', delta: '-1.3' },
  { label: 'Press Mentions', value: '342/wk', delta: '+11.5' },
  { label: 'Search Interest', value: '91 idx', delta: '+2.1' },
  { note: 'SIMULATED — awaiting live source connection' },
];

const BASE_SPEED = 46; // px/sec
const HOVER_SPEED = BASE_SPEED / 6;
const EASE_MS = 450;

function TickerItem({ item }) {
  if (item.note) {
    return (
      <span className="ticker__item">
        <span className="ticker__dot" />
        {item.note}
      </span>
    );
  }
  return (
    <span className="ticker__item">
      <span className="ticker__dot" />
      {item.label} <strong>{item.value}</strong> ({item.delta})
    </span>
  );
}

export default function Ticker() {
  const loop = [...ITEMS, ...ITEMS];
  const rootRef = useGlassSurface();
  const trackRef = useRef(null);
  const stateRef = useRef({
    x: 0,
    speed: BASE_SPEED,
    from: BASE_SPEED,
    target: BASE_SPEED,
    easeStart: 0,
    halfWidth: 0,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    function measure() {
      stateRef.current.halfWidth = track.scrollWidth / 2;
    }
    measure();
    window.addEventListener('resize', measure);

    let raf;
    let last = performance.now();

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (s.speed !== s.target) {
        const t = Math.min(1, (now - s.easeStart) / EASE_MS);
        const eased = 1 - (1 - t) ** 3; // ease-out cubic — no jarring snap
        s.speed = s.from + (s.target - s.from) * eased;
      }

      s.x -= s.speed * dt;
      if (s.halfWidth > 0 && -s.x >= s.halfWidth) {
        s.x += s.halfWidth;
      }
      track.style.transform = `translateX(${s.x}px)`;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, []);

  function setTarget(target) {
    const s = stateRef.current;
    s.from = s.speed;
    s.target = target;
    s.easeStart = performance.now();
  }

  return (
    <div
      className="ticker glass"
      ref={rootRef}
      onMouseEnter={() => setTarget(HOVER_SPEED)}
      onMouseLeave={() => setTarget(BASE_SPEED)}
    >
      <div className="ticker__track" ref={trackRef}>
        {loop.map((item, i) => (
          <TickerItem item={item} key={i} />
        ))}
      </div>
    </div>
  );
}
