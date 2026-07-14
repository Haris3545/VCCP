import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER } from '@/lib/constants';
import GrainOverlay from '@/components/layout/GrainOverlay';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Incorrect password');
        setSubmitting(false);
        return;
      }
      const dest = typeof router.query.from === 'string' ? router.query.from : '/dashboard';
      router.push(dest);
    } catch {
      setError('Something went wrong — try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{artistConfig.meta.title}</title>
      </Head>
      <GrainOverlay />
      <div className="login-screen">
        <div className="login-card">
          <div className="kicker">{AGENCY_KICKER}</div>
          <div className="wordmark" style={{ marginTop: 10 }}>
            {artistConfig.wordmark}
          </div>
          <p style={{ color: 'var(--muted)', marginTop: 10, fontSize: 13 }}>
            Cultural intelligence console — enter the access password to continue.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
            />
            {error ? <div className="login-error">{error}</div> : null}
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
