import { useEffect } from 'react';

// Drives the specular glint on every .card (see .card::after in
// globals.css): a single delegated pointermove listener, rather than one
// per card, so cost stays flat no matter how many glass cards are on the
// page. Sets --mx/--my to the pointer's position within whichever card
// it's currently over; @property registration on those two custom
// properties (globals.css) is what makes the highlight glide there
// instead of snapping.
export default function GlassPointer() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return undefined;

    function handleMove(e) {
      const card = e.target.closest?.('.card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x.toFixed(1)}%`);
      card.style.setProperty('--my', `${y.toFixed(1)}%`);
    }

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return null;
}
