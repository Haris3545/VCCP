// Invisible <defs>-only host for the SVG filter the .glass utility class
// references via `backdrop-filter: url(#glass-distortion)` — the
// feDisplacementMap is what actually bends/refracts whatever sits behind a
// glass surface, rather than just blurring it. Mounted once in _app.js so
// every glass surface on the page (ticker, floating nav) can share it.
// Browsers that don't support an SVG filter reference inside backdrop-filter
// (mainly Safari) just ignore it and fall back to the plain blur/saturate.
export default function GlassFilterDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="3" result="softNoise" />
        <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="46" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
