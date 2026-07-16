const LABEL = {
  auto: 'Preview: mobile / desktop',
  mobile: 'Previewing mobile — tap for desktop',
  desktop: 'Previewing desktop — tap to reset',
};

// Internal QA aid, not a product feature — forces the touch (hamburger) or
// mouse (pill-row) nav pattern regardless of the tester's real device, plus
// a phone-width frame for mobile, so both variants are checkable from any
// browser without real touch hardware or devtools device emulation. Safe to
// leave in: defaults to real device behaviour until someone clicks it, and
// the whole console already sits behind the shared-password gate.
//
// State lives in AppShell (see PreviewBanner.js for why) and is passed
// down, so the footer button here and the top banner never disagree.
export default function PreviewToggle({ mode, onCycle }) {
  return (
    <button type="button" className="preview-toggle" onClick={onCycle}>
      {LABEL[mode] ?? LABEL.auto}
    </button>
  );
}
