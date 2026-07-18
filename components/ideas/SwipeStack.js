import { useEffect, useRef, useState } from 'react';
import IdeaCard from './IdeaCard';

const SWIPE_THRESHOLD = 110;
const IDLE_DELAY_MS = 7000;
const FLY_OUT_MS = 260;

// Alternating tilt per depth (indexed by depth - 1) so the stack behind
// the top card reads as a loosely fanned pile rather than a straight,
// perfectly centered stack peeking out symmetrically.
const BEHIND_TRANSFORMS = [
  { rotate: -6, y: 10, scale: 0.97 },
  { rotate: 8, y: 18, scale: 0.94 },
  { rotate: -11, y: 26, scale: 0.91 },
];

// Drag lives entirely on pointer events (covers mouse and touch alike) so
// the same code path handles a real swipe and a mouse drag - no separate
// touch/mouse branches to keep in sync. The desktop-only circle buttons
// (hidden on touch via CSS) reuse the exact same resolveSwipe() path a
// drag would take, just with a synthetic drag distance, so a click and a
// full drag animate identically.
export default function SwipeStack({ ideas, onDecide, onEditIdea, onDeleteIdea }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState(null);
  const [idleHint, setIdleHint] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const startXRef = useRef(0);
  const movedRef = useRef(false);
  const idleTimerRef = useRef(null);

  const top = ideas[0];
  const visible = ideas.slice(0, 4);

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
          <path d="M5 13l4.5 4.5L19 7" />
        </svg>
      </button>

      {visible
        .slice()
        .reverse()
        .map((idea, i) => {
          const depth = visible.length - 1 - i;
          const isTop = depth === 0;
          const t = isTop ? { x: effectiveX, y: 0, rotate: effectiveRotate, scale: 1 } : { x: 0, ...BEHIND_TRANSFORMS[depth - 1] };

          return (
            <IdeaCard
              key={idea.id}
              idea={idea}
              dragX={isTop ? effectiveX : 0}
              flipped={isTop && flipped}
              className={isTop && idleHint && !dragging && !flying ? 'idea-card--idle-hint' : ''}
              style={{
                // Always the same transform function order (translateX,
                // translateY, rotate, scale) for every depth, top included -
                // so when a behind card is promoted to top, it's the same
                // DOM node (matched by key) animating a property change
                // rather than a fresh mount snapping straight into place,
                // and the browser can interpolate cleanly between the two
                // shapes instead of falling back to matrix decomposition.
                transform: `translateX(${t.x}px) translateY(${t.y}px) rotate(${t.rotate}deg) scale(${t.scale})`,
                zIndex: visible.length - depth,
                transition: isTop && dragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onPointerDown={isTop ? handlePointerDown : undefined}
              onPointerMove={isTop ? handlePointerMove : undefined}
              onPointerUp={isTop ? handlePointerUp : undefined}
              onEdit={isTop && onEditIdea ? () => onEditIdea(idea) : undefined}
              onDelete={isTop && onDeleteIdea ? () => onDeleteIdea(idea.id) : undefined}
            />
          );
        })}
    </div>
  );
}
