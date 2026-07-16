import { useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import SwipeStack from './SwipeStack';
import IdeaPiles from './IdeaPiles';
import AddIdeaModal from './AddIdeaModal';
import PileOverlay from './PileOverlay';

export default function IdeasView({ initialResult }) {
  const [ideas, setIdeas] = useState(initialResult.ideas || []);
  const [addOpen, setAddOpen] = useState(false);
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

  async function persistBulkStatus(ids, status) {
    try {
      const res = await fetch('/api/ideas/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error('bulk status update failed');
    } catch (err) {
      console.error('Failed to save bulk idea status', err);
    }
  }

  function handleDecide(id, status) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    persistStatus(id, status);
  }

  function handleBulkStatus(ids, status) {
    const idSet = new Set(ids);
    setIdeas((prev) => prev.map((i) => (idSet.has(i.id) ? { ...i, status } : i)));
    persistBulkStatus(ids, status);
  }

  function handleAdded(idea) {
    setIdeas((prev) => [...prev, idea]);
  }

  async function handleReset() {
    if (!window.confirm('Reset all liked/disliked ideas back to the main stack? This clears every verdict.')) {
      return;
    }
    setIdeas((prev) => prev.map((i) => ({ ...i, status: 'pending' })));
    try {
      const res = await fetch('/api/ideas/reset', { method: 'POST' });
      if (!res.ok) throw new Error('reset failed');
    } catch (err) {
      console.error('Failed to reset ideas', err);
    }
  }

  return (
    <>
      <div className="idea-board">
        {initialResult.notice ? <div className="idea-board__notice">{initialResult.notice}</div> : null}

        <div className="idea-board__actions">
          <button type="button" className="btn btn--primary" onClick={() => setAddOpen(true)}>
            + Add idea
          </button>
          <button type="button" className="btn" onClick={handleReset}>
            Reset ideas
          </button>
        </div>

        <SwipeStack ideas={pending} onDecide={handleDecide} />
        <IdeaPiles liked={liked} disliked={disliked} onOpenPile={setOpenPile} />
      </div>

      <AddIdeaModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAdded} />
      <PileOverlay
        pile={openPile}
        ideas={openPile === 'liked' ? liked : disliked}
        onClose={() => setOpenPile(null)}
        onSwitchVerdict={handleBulkStatus}
        onReturnToStack={(ids) => handleBulkStatus(ids, 'pending')}
      />
    </>
  );
}
