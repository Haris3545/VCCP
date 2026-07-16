import Modal from '@/components/ui/Modal';

export default function IdeaDetailModal({ idea, onClose }) {
  if (!idea) return null;

  return (
    <Modal open={Boolean(idea)} onClose={onClose} title={idea.title}>
      {idea.imageUrl ? (
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 'var(--radius)',
            backgroundImage: `url(${idea.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginBottom: 16,
          }}
        />
      ) : null}

      {idea.description ? (
        <p style={{ color: 'var(--paper)', lineHeight: 1.6, marginBottom: 16 }}>{idea.description}</p>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>No description added.</p>
      )}

      <div className="field-group">
        <span className="field-label">Timeline / lead time</span>
        <span style={{ color: 'var(--paper)', fontSize: 14 }}>{idea.timeline || 'Not specified'}</span>
      </div>
    </Modal>
  );
}
