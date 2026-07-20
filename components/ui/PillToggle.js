import { useEffect, useRef } from 'react';

// The same puck mechanic as the bottom floating tab bar (FloatingTabNav):
// a white puck sits behind whichever option is active, and glides to
// preview whichever one the pointer is currently over on a plain hover -
// no drag, nothing selected until an actual click - snapping back to the
// real active option the moment the pointer leaves. Shared here rather
// than reimplemented per call site since the Media Trend Index's period
// switch and both Media views' category filter all want the identical
// look and feel.
export default function PillToggle({ options, value, onChange, className = '' }) {
  const trackRef = useRef(null);
  const puckRef = useRef(null);
  const btnRefs = useRef([]);
  const hoveringRef = useRef(false);
  const activeIndex = Math.max(0, options.findIndex((o) => o.id === value));

  function movePuckTo(index, instant) {
    const track = trackRef.current;
    const puck = puckRef.current;
    const el = btnRefs.current[index];
    if (!track || !puck || !el) return;
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (instant) puck.style.transition = 'none';
    puck.style.width = `${elRect.width}px`;
    puck.style.transform = `translateX(${elRect.left - trackRect.left}px)`;
    if (instant) {
      // eslint-disable-next-line no-unused-expressions
      puck.getBoundingClientRect();
      puck.style.transition = '';
    }
  }

  useEffect(() => {
    movePuckTo(activeIndex, true);
    function onResize() {
      if (!hoveringRef.current) movePuckTo(activeIndex, true);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, options.length]);

  function handlePointerMove(e) {
    const index = btnRefs.current.findIndex((el) => el?.contains(e.target));
    if (index === -1) return;
    hoveringRef.current = true;
    movePuckTo(index);
  }

  function handlePointerLeave() {
    hoveringRef.current = false;
    movePuckTo(activeIndex);
  }

  return (
    <div
      className={`pill-toggle ${className}`.trim()}
      ref={trackRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="pill-toggle__puck" ref={puckRef} aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          className={`pill-toggle__btn${value === o.id ? ' pill-toggle__btn--active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
