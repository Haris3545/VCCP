import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { compressImage } from './compressImage';

// A response that never reaches our own API code (Vercel rejects request
// bodies over its own hard ~4.5MB serverless function limit before this
// route runs) comes back as plain text, not JSON - res.json() throws a
// raw, unreadable "Unexpected token" parse error in that case.
async function parseResponse(res) {
  try {
    return await res.json();
  } catch {
    throw new Error(
      res.status === 413 ? 'That image is too large — try a smaller photo.' : `Something went wrong (status ${res.status}). Try again.`
    );
  }
}

export default function EditIdeaModal({ idea, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', timeline: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
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

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setError('');
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(compressed);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompressing(false);
    }
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
      const data = await parseResponse(res);
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
          style={imagePreview && !compressing ? { backgroundImage: `url(${imagePreview})`, color: 'transparent' } : undefined}
        >
          {compressing ? 'Compressing…' : imagePreview ? '' : 'Add an image (optional) — tap to choose'}
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={compressing} />
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

        <button type="submit" className="btn btn--primary" disabled={submitting || compressing}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}
