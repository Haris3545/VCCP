import { useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import SwipeStack from './SwipeStack';
import IdeaPiles from './IdeaPiles';
import AddIdeaModal from './AddIdeaModal';
import IdeaDetailModal from './IdeaDetailModal';
import PileReviewModal from './PileReviewModal';

export default function IdeasView({ initialResult }) {
  const [ideas, setIdeas] = useState(initialResult.ideas || []);
  const [addOpen, setAddOpen] = useState(false);
  const [detailIdea, setDetailIdea] = useState(null);
  const [openPile, setOpenPile] = useState(null);

  if (initialResult.source === 'unavailable') {
    return (
      <EmptyState>
        Ideas needs a connected data store to work — {initialResult.reason}. See README for setup.
      </EmptyState>
    );
  }

  const pending = ideas.filter((i) => i.status === 'pending');
  const liked = ideas.filter((i) => i.status === 'liked');
  const disliked = ideas.filter((i) => i.status === 'disliked');

  async function persistStatus(id, status) {
    try {
      const res = await fetch(`/api/ideas/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('status update failed');
    } catch (err) {
      // Local state already reflects the decision either way — a failed
      // write here just means it silently won't have persisted for
      // everyone else. No retry/notification system exists yet to surface
      // that more honestly.
      console.error('Failed to save idea status', err);
    }
  }

  function handleDecide(id, status) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    persistStatus(id, status);
  }

  function handleAdded(idea) {
    setIdeas((prev) => [...prev, idea]);
  }

  return (
    <>
      <div className="idea-board">
        {initialResult.notice ? <div className="idea-board__notice">{initialResult.notice}</div> : null}

        <button type="button" className="btn btn--primary" onClick={() => setAddOpen(true)}>
          + Add idea
        </button>

        <SwipeStack ideas={pending} onDecide={handleDecide} onOpenDetail={setDetailIdea} />
        <IdeaPiles liked={liked} disliked={disliked} onOpenPile={setOpenPile} />
      </div>

      <AddIdeaModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAdded} />
      <IdeaDetailModal idea={detailIdea} onClose={() => setDetailIdea(null)} />
      <PileReviewModal
        pile={openPile}
        ideas={openPile === 'liked' ? liked : disliked}
        onClose={() => setOpenPile(null)}
        onMove={(id, status) => handleDecide(id, status)}
      />
    </>
  );
}
