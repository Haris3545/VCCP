function PileStack({ label, ideas, onClick }) {
  const preview = ideas.slice(0, 3);
  return (
    <button type="button" className="idea-pile" onClick={onClick} disabled={ideas.length === 0}>
      <div className="idea-pile__stack">
        {preview.length === 0 ? (
          <div className="idea-pile__card" style={{ opacity: 0.4 }} />
        ) : (
          preview
            .slice()
            .reverse()
            .map((idea, i) => (
              <div
                key={idea.id}
                className="idea-pile__card"
                style={{
                  backgroundImage: idea.imageUrl ? `url(${idea.imageUrl})` : undefined,
                  transform: `translate(${(preview.length - 1 - i) * 4}px, ${(preview.length - 1 - i) * -4}px)`,
                }}
              />
            ))
        )}
      </div>
      <span className="idea-pile__label">
        {label} <span className="idea-pile__count">({ideas.length})</span>
      </span>
    </button>
  );
}

export default function IdeaPiles({ liked, disliked, onOpenPile }) {
  return (
    <div className="idea-piles">
      <PileStack label="Liked" ideas={liked} onClick={() => onOpenPile('liked')} />
      <PileStack label="Disliked" ideas={disliked} onClick={() => onOpenPile('disliked')} />
    </div>
  );
}
