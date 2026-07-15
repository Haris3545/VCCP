import FilmGrain from './FilmGrain';

// Fixed photo + scrim + animated grain behind the whole app shell (dashboard,
// audience, strategy). Replaces the flat GrainOverlay texture there — cards
// and the header stay opaque/glass as before, so this only shows through
// the gaps and margins.
export default function DashboardBackground() {
  return (
    <>
      <div className="app-bg-photo" aria-hidden="true" />
      <div className="app-bg-scrim" aria-hidden="true" />
      <FilmGrain opacity={0.14} />
    </>
  );
}
