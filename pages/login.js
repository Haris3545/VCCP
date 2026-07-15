import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER, STUDIO_NAME } from '@/lib/constants';
import FilmGrain from '@/components/layout/FilmGrain';
import { startPageTransition } from '@/lib/pageTransition';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const enterBtnRef = useRef(null);

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
      const rect = enterBtnRef.current?.getBoundingClientRect();
      if (rect) {
        startPageTransition(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
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
      <div className="login-screen">
        <video className="login-bg-video" autoPlay muted loop playsInline>
          <source src="/media/login-bg.webm" type="video/webm" />
          <source src="/media/login-bg.mp4" type="video/mp4" />
        </video>
        <div className="login-scrim" />
        <FilmGrain opacity={0.16} />
        <div className="login-vignette" />

        <div className="login-card">
          <div className="kicker">{AGENCY_KICKER}</div>
          <div className="wordmark" style={{ marginTop: 10 }}>
            {STUDIO_NAME}
          </div>
          <hr className="flourish" />
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
            <button type="submit" className="btn-sweep" disabled={submitting} ref={enterBtnRef}>
              <span>{submitting ? 'Checking…' : 'Enter'}</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
