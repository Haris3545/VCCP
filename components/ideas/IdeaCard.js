export default function IdeaCard({
  idea,
  dragX = 0,
  dragRotate = 0,
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
      className={`idea-card ${className}`}
      style={{
        transform: `translateX(${dragX}px) rotate(${dragRotate}deg)`,
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
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
  );
}
