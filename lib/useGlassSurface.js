import { useCallback, useRef } from 'react';
import { attachGlassHighlight } from './glassHighlight';
import { attachAdaptiveTint } from './adaptiveGlassTint';

// Wires up both halves of the .glass utility (see globals.css) via a
// callback ref rather than a plain useRef + mount-only useEffect — several
// glass surfaces (the floating nav's collapsed unfurl panel, a pile
// overlay's selection action bar) mount and unmount conditionally well
// after their owning component's own first render, and a mount-only effect
// would see a still-null ref at that point and never attach at all. A
// callback ref re-fires exactly when the real DOM node appears or is
// removed, whenever that happens to be.
export function useGlassSurface() {
  const cleanupRef = useRef(null);
  return useCallback((el) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (el) {
      const cleanupHighlight = attachGlassHighlight(el);
      const cleanupTint = attachAdaptiveTint(el);
      cleanupRef.current = () => {
        cleanupHighlight();
        cleanupTint();
      };
    }
  }, []);
}

// Same idea, but for surfaces where sampling the app's background photo
// would be misleading — an opaque backdrop (a modal, an overlay) sits
// between the surface and that photo, so there's nothing real to sample.
export function useGlassHighlightOnly() {
  const cleanupRef = useRef(null);
  return useCallback((el) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (el) {
      cleanupRef.current = attachGlassHighlight(el);
    }
  }, []);
}
