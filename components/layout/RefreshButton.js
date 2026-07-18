import { useState } from 'react';
import { useGlassSurface } from '@/lib/useGlassSurface';

export default function RefreshButton() {
  const [status, setStatus] = useState('idle');
  const btnRef = useGlassSurface();

  async function handleRefresh() {
    setStatus('loading');
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('refresh failed');
      window.location.reload();
    } catch {
      setStatus('error');
    }
  }

  const label =
    status === 'loading' ? 'Refreshing…' : status === 'error' ? 'Refresh failed — retry' : 'Refresh everything';

  return (
    <button
      type="button"
      className="btn-refresh glass"
      ref={btnRef}
      onClick={handleRefresh}
      disabled={status === 'loading'}
    >
      {label}
    </button>
  );
}
