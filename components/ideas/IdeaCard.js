export default function IdeaCard({
  idea,
  dragX = 0,
  dragRotate = 0,
  flipped = false,
  style,
  className = '',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onEdit,
  onDelete,
}) {
  const likeOpacity = Math.min(1, Math.max(0, dragX / 90));
  const dislikeOpacity = Math.min(1, Math.max(0, -dragX / 90));

  return (
    <div
      className={`idea-card ${flipped ? 'idea-card--flipped' : ''} ${className}`}
      style={{
        transform: `translateX(${dragX}px) rotate(${dragRotate}deg)`,
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="idea-card__flip">
        <div className="idea-card__face idea-card__face--front">
          {idea.imageUrl ? (
            <div className="idea-card__image" style={{ backgroundImage: `url(${idea.imageUrl})` }} />
          ) : (
            <div className="idea-card__image idea-card__image--placeholder">No image</div>
          )}
          <div className="idea-card__scrim" />
          <div className="idea-card__title">{idea.title}</div>
          <div className="idea-card__stamp idea-card__stamp--like" style={{ opacity: likeOpacity }}>
            Like
          </div>
          <div className="idea-card__stamp idea-card__stamp--dislike" style={{ opacity: dislikeOpacity }}>
            Pass
          </div>
        </div>

        <div className="idea-card__face idea-card__face--back">
          {idea.imageUrl ? (
            <div className="idea-card__back-bg" style={{ backgroundImage: `url(${idea.imageUrl})` }} />
          ) : null}
          <div className="idea-card__back-scrim" />
          <div className="idea-card__back-content">
            <div className="idea-card__back-header">
              <div className="idea-card__back-title">{idea.title}</div>
              {onEdit || onDelete ? (
                <div
                  className="idea-card__back-actions"
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                >
                  {onEdit ? (
                    <button
                      type="button"
                      className="idea-card__back-action idea-card__back-action--edit"
                      aria-label={`Edit "${idea.title}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.83l-1.17-1.17a2 2 0 0 0-2.83 0L4 15v5z" />
                        <path d="M13 6.5l4.5 4.5" />
                      </svg>
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      className="idea-card__back-action idea-card__back-action--delete"
                      aria-label={`Delete "${idea.title}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6" />
                        <path d="M6.5 7l.8 12a1 1 0 0 0 1 1h7.4a1 1 0 0 0 1-1l.8-12" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="idea-card__back-description">{idea.description || 'No description added.'}</p>
            <div className="idea-card__back-timeline">
              <span>Timeline / lead time</span>
              <strong>{idea.timeline || 'Not specified'}</strong>
            </div>
            <div className="idea-card__back-hint">Tap to flip back</div>
          </div>
        </div>
      </div>
    </div>
  );
}
