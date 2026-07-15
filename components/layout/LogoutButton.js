import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }

  return (
    <button type="button" className="btn btn--ghost" onClick={handleLogout} disabled={loading}>
      {loading ? 'Logging out…' : 'Log out'}
    </button>
  );
}
