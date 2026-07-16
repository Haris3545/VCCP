import Modal from '@/components/ui/Modal';

const OTHER_STATUS = { liked: 'disliked', disliked: 'liked' };
const OTHER_LABEL = { liked: 'Move to disliked', disliked: 'Move to liked' };

export default function PileReviewModal({ pile, ideas, onClose, onMove }) {
  if (!pile) return null;

  return (
    <Modal open={Boolean(pile)} onClose={onClose} title={pile === 'liked' ? 'Liked ideas' : 'Disliked ideas'} wide>
      {ideas.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nothing here yet.</p>
      ) : (
        <div className="idea-pile-grid">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="idea-pile-grid__item"
              style={{ backgroundImage: idea.imageUrl ? `url(${idea.imageUrl})` : undefined }}
            >
              <button
                type="button"
                className="idea-pile-grid__move"
                onClick={() => onMove(idea.id, OTHER_STATUS[pile])}
                aria-label={`${OTHER_LABEL[pile]}: ${idea.title}`}
                title={OTHER_LABEL[pile]}
              >
                ⇄
              </button>
              <div className="idea-pile-grid__title">{idea.title}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
