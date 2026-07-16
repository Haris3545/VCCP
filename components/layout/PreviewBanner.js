// Unmissable top banner while PreviewToggle's QA override is forced —
// the point is a stuck preview mode never just looks like a broken
// layout with no explanation. Rendered as a sibling of .app-shell (see
// AppShell.js) rather than inside it, so mobile-preview mode's transform
// on .app-shell — which deliberately confines the background photo to
// the phone-width frame — can't also trap this outside the frame.
export default function PreviewBanner({ mode, onReset }) {
  if (mode === 'auto') return null;

  return (
    <button type="button" className="preview-banner" onClick={onReset}>
      {`QA preview forced to ${mode} — this isn’t your real device. Tap to reset.`}
    </button>
  );
}
