import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

export default function EditIdeaModal({ idea, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', timeline: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idea) return;
    setForm({ title: idea.title, description: idea.description || '', timeline: idea.timeline || '' });
    setImageFile(null);
    setImagePreview(idea.imageUrl || null);
    setError('');
  }, [idea]);

  if (!idea) return null;

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Give the idea a title.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      let imageBase64 = null;
      let imageType = null;
      if (imageFile) {
        imageType = imageFile.type;
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageBase64, imageType }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save changes');

      onSaved(data.idea);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(idea)} onClose={onClose} title="Edit idea" solid>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label
          className="image-drop"
          style={imagePreview ? { backgroundImage: `url(${imagePreview})`, color: 'transparent' } : undefined}
        >
          {imagePreview ? '' : 'Add an image (optional) — tap to choose'}
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        <div className="field-group">
          <label className="field-label" htmlFor="edit-idea-title">
            Title
          </label>
          <input
            id="edit-idea-title"
            className="field-input"
            value={form.title}
            maxLength={80}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="edit-idea-description">
            Short description
          </label>
          <textarea
            id="edit-idea-description"
            className="field-textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="edit-idea-timeline">
            Timeline / lead time
          </label>
          <input
            id="edit-idea-timeline"
            className="field-input"
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
          />
        </div>

        {error ? <div className="field-error">{error}</div> : null}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}
