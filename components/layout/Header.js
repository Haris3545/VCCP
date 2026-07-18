import { useEffect, useRef, useState } from 'react';
import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER, STUDIO_NAME } from '@/lib/constants';
import LogoutButton from './LogoutButton';

// The artist name doubles as the profile trigger — click it to unfurl a
// small menu with Log out, rather than logout living as its own separate
// control elsewhere (it was previously folded into the floating tab nav,
// which made that nav read as six tabs instead of five).
export default function Header() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDocPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="header">
      <div className="container header__row">
        <div className="header__identity">
          <span className="kicker">{AGENCY_KICKER}</span>
          <span className="header__studio-name">{STUDIO_NAME}</span>
        </div>

        <div className="header__profile" ref={rootRef}>
          <button
            type="button"
            className="header__profile-trigger"
            aria-expanded={open}
            aria-controls="header-profile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="header__artist-name">{artistConfig.artistName}</span>
            <span className="header__profile-glyph" aria-hidden="true">+</span>
          </button>
          <div className="header__profile-menu" id="header-profile-menu" data-open={open}>
            <div className="header__profile-menu-inner">
              <LogoutButton className="header__profile-logout" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
