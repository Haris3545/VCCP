// Fixed, full-viewport noise layer rendered once. Uses an inline SVG
// feTurbulence filter instead of an image asset — no network dependency.
export default function GrainOverlay() {
  return (
    <div
      className="grain-overlay"
      aria-hidden="true"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}
