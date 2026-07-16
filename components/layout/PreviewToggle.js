import { useEffect } from 'react';
import { useLocalStorage } from '@/lib/useLocalStorage';

const NEXT_MODE = { auto: 'mobile', mobile: 'desktop', desktop: 'auto' };
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
export default function PreviewToggle() {
  const [mode, setMode] = useLocalStorage('previewMode', 'auto');

  useEffect(() => {
    if (mode === 'auto') {
      delete document.documentElement.dataset.preview;
    } else {
      document.documentElement.dataset.preview = mode;
    }
  }, [mode]);

  return (
    <button type="button" className="preview-toggle" onClick={() => setMode((m) => NEXT_MODE[m] ?? 'auto')}>
      {LABEL[mode] ?? LABEL.auto}
    </button>
  );
}
