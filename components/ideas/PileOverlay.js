import { useEffect, useRef, useState } from 'react';
import EditIdeaModal from './EditIdeaModal';

const DROPZONE_HEIGHT = 120;
const MOVE_THRESHOLD = 6;

// Stable per-card "personality" for the group-drag cluster and jiggle, so
// the same card always fans out to the same spot/angle/delay rather than
// re-randomizing every render - derived from the id, not Math.random().
function seedFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function GridCard({ idea, selectMode, selected, dimmed, jiggleDelay, onCardClick, onPointerDown, cardRef }) {
  const seed = seedFromId(idea.id);
  // (seed % 5) - 2 can land on exactly 0 for ~1 in 5 cards, leaving them
  // visibly still - keep the magnitude strictly positive and vary sign
  // and size separately instead.
  const jiggleRotate = (0.35 + (seed % 4) * 0.1) * (seed % 2 === 0 ? 1 : -1); // ±0.35..0.65deg

  return (
    <div
      ref={cardRef}
      className={`pile-grid-card${selectMode ? ' pile-grid-card--jiggle' : ''}${dimmed ? ' pile-grid-card--dimmed' : ''}`}
      style={{
        backgroundImage: idea.imageUrl ? `url(${idea.imageUrl})` : undefined,
        animationDelay: `${jiggleDelay}ms`,
        '--jiggle-rot': `${jiggleRotate}deg`,
      }}
      onPointerDown={(e) => onPointerDown(e, idea.id)}
      onClick={() => onCardClick(idea.id)}
    >
      {selectMode ? (
        <span className={`pile-grid-card__check${selected ? ' pile-grid-card__check--on' : ''}`} aria-hidden="true" />
      ) : null}
      <div className="pile-grid-card__title">{idea.title}</div>
    </div>
  );
}

export default function PileOverlay({ pile, ideas, onClose, onSwitchVerdict, onReturnToStack, onEditIdea, onDeleteIdea }) {
  const [renderedPile, setRenderedPile] = useState(pile);
  const [closingOverlay, setClosingOverlay] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [enlarged, setEnlarged] = useState(null); // { idea, fromRect, closing }
  const [flippedEnlarged, setFlippedEnlarged] = useState(false);
  const [drag, setDrag] = useState(null); // { ids, primaryId, x, y, rotate, snapBack, offsets }
  const [overDropzone, setOverDropzone] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);

  const cardRefs = useRef(new Map());
  const dragStateRef = useRef(null);
  const justDraggedRef = useRef(false);

  // The overlay itself needs to keep rendering for a moment after `pile`
  // goes null, so the "furl" close animation has something to animate -
  // same lagging-state trick as the enlarge view's own open/close.
  useEffect(() => {
    if (pile) {
      setRenderedPile(pile);
      setClosingOverlay(false);
      return undefined;
    }
    if (renderedPile) {
      setClosingOverlay(true);
      const t = setTimeout(() => setRenderedPile(null), 320);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pile]);

  useEffect(() => {
    if (!renderedPile) return undefined;
    document.body.style.overflow = 'hidden';
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (enlarged) closeEnlarge();
        else onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderedPile, enlarged]);

  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setEnlarged(null);
    setEditingIdea(null);
  }, [pile]);

  if (!renderedPile) return null;

  const label = renderedPile === 'liked' ? 'Liked ideas' : 'Disliked ideas';
  const otherStatus = renderedPile === 'liked' ? 'disliked' : 'liked';
  const otherLabel = renderedPile === 'liked' ? 'Disliked' : 'Liked';

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(ideas.map((i) => i.id)));
  }

  function openEnlarge(id) {
    const el = cardRefs.current.get(id);
    const idea = ideas.find((i) => i.id === id);
    if (!el || !idea) return;
    setFlippedEnlarged(false);
    setEnlarged({ idea, fromRect: el.getBoundingClientRect(), closing: false });
  }

  function closeEnlarge() {
    setEnlarged((prev) => (prev ? { ...prev, closing: true } : prev));
    setTimeout(() => setEnlarged(null), 320);
  }

  function handleCardClick(id) {
    if (justDraggedRef.current) return;
    if (selectMode) toggleSelect(id);
    else openEnlarge(id);
  }

  // --- Drag: single card, or the whole selection if the grabbed card is
  // part of a multi-selection ------------------------------------------
  function handlePointerDown(e, id) {
    if (e.button !== undefined && e.button !== 0) return;
    const el = cardRefs.current.get(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const grabOffsetX = e.clientX - (rect.left + rect.width / 2);

    const groupIds = selectMode && selectedIds.has(id) && selectedIds.size > 1 ? [...selectedIds] : [id];

    const offsets = new Map();
    groupIds.forEach((otherId) => {
      if (otherId === id) {
        offsets.set(otherId, { dx: 0, dy: 0, rot: 0 });
        return;
      }
      const s = seedFromId(otherId);
      const angle = (s % 360) * (Math.PI / 180);
      const radius = 16 + (s % 20);
      offsets.set(otherId, {
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius - 10,
        rot: ((s % 13) - 6) * 1.4,
      });
    });

    const state = {
      ids: groupIds,
      primaryId: id,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      grabOffsetX,
      cardW: rect.width,
      moved: false,
      offsets,
      originRects: new Map(groupIds.map((gid) => [gid, cardRefs.current.get(gid)?.getBoundingClientRect()])),
    };
    dragStateRef.current = state;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handlePointerMove(e) {
    const state = dragStateRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) > MOVE_THRESHOLD) state.moved = true;
    if (!state.moved) return;

    const velocityRot = clamp((e.clientX - state.lastX) * 1.6, -14, 14);
    const biasRot = clamp((state.grabOffsetX / (state.cardW / 2)) * 7, -9, 9);
    state.lastX = e.clientX;

    const originRect = state.originRects.get(state.primaryId);
    const x = originRect ? originRect.left + originRect.width / 2 + dx : e.clientX;
    const y = originRect ? originRect.top + originRect.height / 2 + dy : e.clientY;

    setDrag({
      ids: state.ids,
      primaryId: state.primaryId,
      x,
      y,
      rotate: velocityRot + biasRot,
      offsets: state.offsets,
    });

    setOverDropzone(e.clientY < DROPZONE_HEIGHT);
  }

  function handlePointerUp(e) {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    const state = dragStateRef.current;
    dragStateRef.current = null;
    if (!state) return;

    if (!state.moved) {
      setDrag(null);
      setOverDropzone(false);
      return;
    }

    // A real drag happened - the browser may still fire a synchronous
    // click right after this (e.g. net displacement back near the start),
    // which would otherwise open the enlarge view or toggle selection
    // right after the user let go of a drag.
    justDraggedRef.current = true;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);

    if (e.clientY < DROPZONE_HEIGHT) {
      onReturnToStack(state.ids);
      setDrag(null);
      setOverDropzone(false);
      return;
    }

    // Snap back to the grid, then clear.
    setDrag((prev) => (prev ? { ...prev, snapBack: true } : prev));
    setOverDropzone(false);
    setTimeout(() => setDrag(null), 260);
  }

  function handleBulkSwitch() {
    onSwitchVerdict([...selectedIds], otherStatus);
    setSelectedIds(new Set());
  }

  function handleBulkReturn() {
    onReturnToStack([...selectedIds]);
    setSelectedIds(new Set());
  }

  function handleEditSaved(idea) {
    onEditIdea(idea);
    setEditingIdea(null);
  }

  function handleDeleteEnlarged() {
    if (!enlarged) return;
    if (!window.confirm('Delete this idea? This cannot be undone.')) return;
    onDeleteIdea(enlarged.idea.id);
    closeEnlarge();
  }

  const draggedIds = new Set(drag?.ids || []);

  return (
    <div className={`pile-overlay${closingOverlay ? ' pile-overlay--closing' : ''}`}>
      <div className="pile-overlay__header">
        <button type="button" className="pile-overlay__select-toggle" onClick={toggleSelectMode}>
          {selectMode ? 'Done' : 'Select'}
        </button>
        <h2>
          {label} <span className="pile-overlay__count">({ideas.length})</span>
        </h2>
        <button type="button" className="pile-overlay__close" onClick={onClose} aria-label="Close">
          <span />
          <span />
        </button>
      </div>

      {selectMode ? (
        <div className="pile-overlay__select-bar">
          <button type="button" className="pile-overlay__select-all" onClick={selectAll}>
            Select all
          </button>
          {selectedIds.size > 0 ? <span className="pile-overlay__selected-count">{selectedIds.size} selected</span> : null}
        </div>
      ) : null}

      <div className={`pile-overlay__dropzone${drag ? ' pile-overlay__dropzone--active' : ''}${overDropzone ? ' pile-overlay__dropzone--over' : ''}`}>
        Drop here to send back to the stack
      </div>

      {ideas.length === 0 ? (
        <div className="pile-overlay__empty">Nothing here yet.</div>
      ) : (
        <div className="pile-overlay__grid">
          {ideas.map((idea) => (
            <GridCard
              key={idea.id}
              idea={idea}
              selectMode={selectMode}
              selected={selectedIds.has(idea.id)}
              dimmed={draggedIds.has(idea.id)}
              jiggleDelay={(seedFromId(idea.id) % 5) * 40}
              onCardClick={handleCardClick}
              onPointerDown={handlePointerDown}
              cardRef={(el) => {
                if (el) cardRefs.current.set(idea.id, el);
                else cardRefs.current.delete(idea.id);
              }}
            />
          ))}
        </div>
      )}

      {selectMode && selectedIds.size > 0 ? (
        <div className="pile-overlay__action-bar">
          <button type="button" className="btn" onClick={handleBulkReturn}>
            Return {selectedIds.size} to stack
          </button>
          <button type="button" className="btn btn--primary" onClick={handleBulkSwitch}>
            Switch {selectedIds.size} to {otherLabel}
          </button>
        </div>
      ) : null}

      {drag ? (
        <div className="pile-overlay__drag-layer">
          {drag.ids.map((id) => {
            const idea = ideas.find((i) => i.id === id);
            if (!idea) return null;
            const offset = drag.offsets.get(id) || { dx: 0, dy: 0, rot: 0 };
            const isPrimary = id === drag.primaryId;
            return (
              <div
                key={id}
                className={`pile-drag-ghost${isPrimary ? ' pile-drag-ghost--primary' : ''}${drag.snapBack ? ' pile-drag-ghost--snap' : ''}`}
                style={{
                  backgroundImage: idea.imageUrl ? `url(${idea.imageUrl})` : undefined,
                  left: drag.x + offset.dx,
                  top: drag.y + offset.dy,
                  transform: `translate(-50%, -50%) rotate(${drag.rotate + offset.rot}deg)`,
                }}
              />
            );
          })}
        </div>
      ) : null}

      {enlarged ? (
        <EnlargedIdea
          idea={enlarged.idea}
          fromRect={enlarged.fromRect}
          closing={enlarged.closing}
          flipped={flippedEnlarged}
          onFlip={() => setFlippedEnlarged((v) => !v)}
          onDismiss={closeEnlarge}
          onSwitchVerdict={() => {
            onSwitchVerdict([enlarged.idea.id], otherStatus);
            closeEnlarge();
          }}
          switchLabel={`Switch to ${otherLabel}`}
          onEdit={() => {
            // Close the enlarge view outright (no shrink animation) rather
            // than via closeEnlarge() - its backdrop sits at a higher
            // z-index than the edit modal, which otherwise silently
            // intercepts every click meant for the modal underneath it.
            setEditingIdea(enlarged.idea);
            setEnlarged(null);
          }}
          onDelete={handleDeleteEnlarged}
        />
      ) : null}

      <EditIdeaModal idea={editingIdea} onClose={() => setEditingIdea(null)} onSaved={handleEditSaved} />
    </div>
  );
}

function EnlargedIdea({ idea, fromRect, closing, flipped, onFlip, onDismiss, onSwitchVerdict, switchLabel, onEdit, onDelete }) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fromRect) return undefined;
    const target = el.getBoundingClientRect();
    const dx = fromRect.left + fromRect.width / 2 - (target.left + target.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (target.top + target.height / 2);
    const scale = Math.max(0.15, fromRect.width / target.width);

    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    el.style.opacity = '0.7';

    let raf1;
    let raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.style.transition = 'transform 340ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease';
        el.style.transform = 'translate(0, 0) scale(1)';
        el.style.opacity = '1';
        setEntered(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [fromRect]);

  useEffect(() => {
    if (!closing || !entered) return;
    const el = ref.current;
    if (!el || !fromRect) return;
    const target = el.getBoundingClientRect();
    const dx = fromRect.left + fromRect.width / 2 - (target.left + target.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (target.top + target.height / 2);
    const scale = Math.max(0.15, fromRect.width / target.width);
    el.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.6, 1), opacity 260ms ease';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    el.style.opacity = '0.5';
  }, [closing, entered, fromRect]);

  return (
    <div className={`pile-enlarge-backdrop${closing ? ' pile-enlarge-backdrop--closing' : ''}`} onClick={onDismiss}>
      <div
        ref={ref}
        className={`pile-enlarge-card${flipped ? ' pile-enlarge-card--flipped' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onFlip();
        }}
      >
        <div className="pile-enlarge-card__flip">
          <div className="pile-enlarge-card__face pile-enlarge-card__face--front">
            {idea.imageUrl ? (
              <div className="idea-card__image" style={{ backgroundImage: `url(${idea.imageUrl})` }} />
            ) : (
              <div className="idea-card__image idea-card__image--placeholder">No image</div>
            )}
            <div className="idea-card__scrim" />
            <div className="idea-card__title">{idea.title}</div>
          </div>
          <div className="pile-enlarge-card__face pile-enlarge-card__face--back">
            {idea.imageUrl ? (
              <div className="idea-card__back-bg" style={{ backgroundImage: `url(${idea.imageUrl})` }} />
            ) : null}
            <div className="idea-card__back-scrim" />
            <div className="idea-card__back-content">
              <div className="idea-card__back-title">{idea.title}</div>
              <p className="idea-card__back-description">{idea.description || 'No description added.'}</p>
              <div className="idea-card__back-timeline">
                <span>Timeline / lead time</span>
                <strong>{idea.timeline || 'Not specified'}</strong>
              </div>
              <button
                type="button"
                className="pile-enlarge-card__switch"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitchVerdict();
                }}
              >
                {switchLabel}
              </button>
              <div className="pile-enlarge-card__row">
                <button
                  type="button"
                  className="pile-enlarge-card__edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="pile-enlarge-card__delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="idea-card__back-hint">Tap to flip back</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
