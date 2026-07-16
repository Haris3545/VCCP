import { useState } from 'react';
import Modal from '@/components/ui/Modal';

const initialForm = { title: '', description: '', timeline: '' };

export default function AddIdeaModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setForm(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

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

      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageBase64, imageType }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to add idea');

      onAdded(data.idea);
      reset();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New idea">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label
          className="image-drop"
          style={imagePreview ? { backgroundImage: `url(${imagePreview})`, color: 'transparent' } : undefined}
        >
          {imagePreview ? '' : 'Add an image (optional) — tap to choose'}
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        <div className="field-group">
          <label className="field-label" htmlFor="idea-title">
            Title
          </label>
          <input
            id="idea-title"
            className="field-input"
            value={form.title}
            maxLength={80}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Pop-up nail bar at the next tour stop"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="idea-description">
            Short description
          </label>
          <textarea
            id="idea-description"
            className="field-textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is it, and why does it work for this campaign?"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="idea-timeline">
            Timeline / lead time
          </label>
          <input
            id="idea-timeline"
            className="field-input"
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            placeholder="e.g. 3 weeks lead time, needs booking by Friday"
          />
        </div>

        {error ? <div className="field-error">{error}</div> : null}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add idea'}
        </button>
      </form>
    </Modal>
  );
}
