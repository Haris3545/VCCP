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
          <div className="idea-card__back-title">{idea.title}</div>
          <p className="idea-card__back-description">{idea.description || 'No description added.'}</p>
          <div className="idea-card__back-timeline">
            <span>Timeline / lead time</span>
            <strong>{idea.timeline || 'Not specified'}</strong>
          </div>
          <div className="idea-card__back-hint">Tap to flip back</div>
        </div>
      </div>
    </div>
  );
}
