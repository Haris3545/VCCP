import { useEffect, useRef } from 'react';
import artistConfig from '@/lib/artist.config';

// Decorative, always-on strip mirroring the Dashboard tab's own headline
// stats — every item carries its own "Simulated" pill (rather than one
// trailing disclaimer item) so nothing here is ever mistaken for a live feed.
const ITEMS = [
  { label: 'in media', value: '328', delta: '+12' },
  { label: 'Trend index', value: '+6%' },
  { label: 'Total reach', value: '2.4M' },
  { label: 'Sentiment', value: '81%', delta: '+3' },
];

const BASE_SPEED = 46; // px/sec
const HOVER_SPEED = BASE_SPEED / 6;
const EASE_MS = 450;

function TickerItem({ item }) {
  const label = item.label === 'in media' ? `${artistConfig.artistName} in media` : item.label;
  return (
    <span className="ticker__item">
      <span className="ticker__badge">Simulated</span>
      {label} <strong className="ticker__highlight">{item.value}</strong>
      {item.delta && ` (${item.delta})`}
    </span>
  );
}

export default function Ticker() {
  const loop = [...ITEMS, ...ITEMS];
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
      className="ticker container"
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
