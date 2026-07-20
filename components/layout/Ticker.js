import { useEffect, useRef, useState } from 'react';

// Shown until the client-side fetch below resolves, and again if it comes
// back unavailable - the ticker used to show fixed simulated KPI numbers,
// which is exactly what real headlines were meant to replace, so the
// unavailable case is an honest note rather than falling back to those.
const FALLBACK_ITEMS = [{ note: 'Awaiting live source connection — headlines will appear here once coverage is reachable.' }];

const BASE_SPEED = 46; // px/sec
const HOVER_SPEED = BASE_SPEED / 6;
const EASE_MS = 450;

// Some feeds give the outlet's display name as its bare domain (e.g.
// "billboard.com") - strip a trailing .com so it reads as a publication
// name, matching the same cleanup MediaView does for the news strips.
function cleanOutletName(outlet) {
  return outlet.replace(/\.com$/i, '');
}

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
      <strong>{cleanOutletName(item.outlet)}</strong> {item.headline}
    </span>
  );
}

export default function Ticker() {
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const trackRef = useRef(null);
  const stateRef = useRef({
    x: 0,
    speed: BASE_SPEED,
    from: BASE_SPEED,
    target: BASE_SPEED,
    easeStart: 0,
    halfWidth: 0,
  });

  // Real headlines, fetched once client-side rather than threaded through
  // every page's getStaticProps - the ticker renders inside AppShell on
  // every page, most of which never otherwise touch news data at all.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ticker')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.source === 'live' && data.headlines?.length) {
          setItems(data.headlines);
        } else {
          setItems([{ note: data.reason || 'Awaiting live source connection.' }]);
        }
      })
      .catch(() => {
        if (!cancelled) setItems(FALLBACK_ITEMS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-measure the marquee's scrollable width whenever the headlines swap
  // in - the initial fallback note is a very different width to a dozen
  // real headlines, and the wrap-around math below needs the real number
  // or the loop stalls or jumps depending which way it's wrong.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    function measure() {
      stateRef.current.halfWidth = track.scrollWidth / 2;
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [items]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;

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

    return () => cancelAnimationFrame(raf);
  }, []);

  function setTarget(target) {
    const s = stateRef.current;
    s.from = s.speed;
    s.target = target;
    s.easeStart = performance.now();
  }

  const loop = [...items, ...items];

  return (
    <div className="ticker" onMouseEnter={() => setTarget(HOVER_SPEED)} onMouseLeave={() => setTarget(BASE_SPEED)}>
      <div className="ticker__track" ref={trackRef}>
        {loop.map((item, i) => (
          <TickerItem item={item} key={i} />
        ))}
      </div>
    </div>
  );
}
