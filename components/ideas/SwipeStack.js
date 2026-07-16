import { useEffect, useRef, useState } from 'react';
import IdeaCard from './IdeaCard';

const SWIPE_THRESHOLD = 110;
const IDLE_DELAY_MS = 7000;
const FLY_OUT_MS = 260;

// Drag lives entirely on pointer events (covers mouse and touch alike) so
// the same code path handles a real swipe and a mouse drag - no separate
// touch/mouse branches to keep in sync. The desktop-only circle buttons
// (hidden on touch via CSS) reuse the exact same resolveSwipe() path a
// drag would take, just with a synthetic drag distance, so a click and a
// full drag animate identically.
export default function SwipeStack({ ideas, onDecide }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState(null);
  const [idleHint, setIdleHint] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const startXRef = useRef(0);
  const movedRef = useRef(false);
  const idleTimerRef = useRef(null);

  const top = ideas[0];
  const behind = ideas.slice(1, 3);

  useEffect(() => {
    resetIdleTimer();
    setFlipped(false);
    return () => clearTimeout(idleTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top?.id]);

  function resetIdleTimer() {
    setIdleHint(false);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIdleHint(true), IDLE_DELAY_MS);
  }

  function handlePointerDown(e) {
    if (flying) return;
    resetIdleTimer();
    movedRef.current = false;
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setDragX(0);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 4) movedRef.current = true;
    setDragX(dx);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);

    if (!movedRef.current) {
      setDragX(0);
      setFlipped((f) => !f);
      return;
    }

    if (dragX > SWIPE_THRESHOLD) {
      resolveSwipe('liked');
    } else if (dragX < -SWIPE_THRESHOLD) {
      resolveSwipe('disliked');
    } else {
      setDragX(0);
    }
  }

  function resolveSwipe(status) {
    setFlying(status);
    setTimeout(() => {
      onDecide(top.id, status);
      setFlying(null);
      setDragX(0);
      resetIdleTimer();
    }, FLY_OUT_MS);
  }

  function handleButtonDecide(status) {
    if (!top || flying) return;
    resetIdleTimer();
    setDragX(status === 'liked' ? SWIPE_THRESHOLD + 40 : -(SWIPE_THRESHOLD + 40));
    resolveSwipe(status);
  }

  if (!top) {
    return (
      <div className="idea-stack">
        <div className="idea-stack__empty">All caught up — add a new idea, or check the piles below.</div>
      </div>
    );
  }

  const effectiveX = flying ? (flying === 'liked' ? 640 : -640) : dragX;
  const effectiveRotate = Math.max(-18, Math.min(18, effectiveX / 12));

  return (
    <div className="idea-stack">
      <button
        type="button"
        className="idea-stack__action idea-stack__action--dislike"
        onClick={() => handleButtonDecide('disliked')}
        aria-label={`Dislike "${top.title}"`}
      >
        <svg viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <button
        type="button"
        className="idea-stack__action idea-stack__action--like"
        onClick={() => handleButtonDecide('liked')}
        aria-label={`Like "${top.title}"`}
      >
        <svg viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {behind
        .slice()
        .reverse()
        .map((idea, i) => {
          const depth = behind.length - i;
          return (
            <IdeaCard
              key={idea.id}
              idea={idea}
              style={{
                transform: `translateY(${depth * 8}px) scale(${1 - depth * 0.03})`,
                zIndex: 1,
                transition: 'transform 260ms ease',
              }}
            />
          );
        })}

      <IdeaCard
        key={top.id}
        idea={top}
        dragX={effectiveX}
        dragRotate={effectiveRotate}
        flipped={flipped}
        className={idleHint && !dragging && !flying ? 'idea-card--idle-hint' : ''}
        style={{
          zIndex: 2,
          transition: dragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
