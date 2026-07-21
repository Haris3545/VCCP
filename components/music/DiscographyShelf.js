import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Cover Art Archive is the keyless counterpart to MusicBrainz's own
// keyless discography lookup (see lib/integrations/musicbrainz.js) - a
// release-group's mbid doubles as its Cover Art Archive key, so the
// shelf needs no separate credential the way the Discogs-backed
// "Releases & pressings" section elsewhere on this page does. Not every
// release-group has scanned art archived, so every image load is treated
// as best-effort (see CDCase's onError below) rather than assumed to
// exist.
function coverUrl(mbid, size) {
  return `https://coverartarchive.org/release-group/${mbid}/front-${size}`;
}

// Deterministic string hash (djb2), same algorithm as lib/media/helpers'
// hashString - kept local rather than imported cross-feature since it's a
// few lines and this component has no other reason to depend on Media.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h);
}

// Fallback spine color for a release-group whose art hasn't loaded (or
// never loads) yet - deterministic so it's stable across renders, and a
// fixed low lightness so the white spine text always has enough contrast
// without a per-instance check.
function fallbackColor(id) {
  const hue = hashString(id) % 360;
  return `hsl(${hue}, 38%, 24%)`;
}

function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Averages the loaded cover art down to a single representative colour -
// a cheap, dependency-free stand-in for real dominant-colour extraction
// (no image-processing package in this project, see package.json), close
// enough for a spine that only needs to read as "this album's colour"
// rather than reproduce its palette exactly. Slightly darkened so a
// bright/pastel cover still gives a spine rich enough to hold white type,
// rather than the sometimes-washed-out result a straight average gives.
function sampleDominantColor(img) {
  const canvas = document.createElement('canvas');
  const w = 16;
  const h = 16;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let r = 0;
  let g = 0;
  let b = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  r = Math.round((r / n) * 0.72);
  g = Math.round((g / n) * 0.72);
  b = Math.round((b / n) * 0.72);
  return { rgb: `rgb(${r}, ${g}, ${b})`, textDark: relativeLuminance(r, g, b) > 0.45 };
}

function typeLabel(rg) {
  if (rg.secondaryTypes?.length) return rg.secondaryTypes[0];
  return rg.primaryType || 'Release';
}

function CDCase({ release, isOpen, onOpen, index }) {
  const [color, setColor] = useState(fallbackColor(release.id));
  const [textDark, setTextDark] = useState(false);
  const [coverOk, setCoverOk] = useState(true);
  const coverRef = useRef(null);

  function handleLoad(e) {
    try {
      const sampled = sampleDominantColor(e.target);
      setColor(sampled.rgb);
      setTextDark(sampled.textDark);
    } catch {
      // Tainted canvas (e.g. a CORS hiccup) - keep the hash-based fallback
      // colour, still deterministic and still reads as "this release."
    }
  }

  return (
    <div
      className="cd-slot"
      style={{
        '--case-color': color,
        '--case-text': textDark ? '#181410' : '#f4f2ea',
        '--stagger-delay': `${Math.min(index * 35, 420)}ms`,
      }}
    >
      <div
        className={`cd-case${isOpen ? ' cd-case--active' : ''}`}
        onClick={() => onOpen(release, coverRef.current, color)}
        role="button"
        tabIndex={0}
        aria-label={`Open ${release.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(release, coverRef.current, color);
          }
        }}
      >
        <div className="cd-case__spine">
          <span className="cd-case__spine-title">{release.title}</span>
        </div>
        <div className="cd-case__cover" ref={coverRef}>
          {coverOk ? (
            <img
              src={coverUrl(release.id, 250)}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              onLoad={handleLoad}
              onError={() => setCoverOk(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const EXPANDED_SIZE = 340;

export default function DiscographyShelf({ releaseGroups }) {
  const releases = (releaseGroups || []).slice(0, 30);
  const [openRelease, setOpenRelease] = useState(null);
  const [flip, setFlip] = useState(null); // { dx, dy, scale, color }
  const [animateIn, setAnimateIn] = useState(false);
  // Separate from animateIn: animateIn flips back to false to drive the
  // *closing* FLIP (settled -> start position), but the transition itself
  // needs to stay switched on through that close, not switch off the
  // moment animateIn does. transitionReady turns on once (after the first
  // open frame has painted) and stays on until this whole overlay
  // unmounts, so both the open and the close FLIP get the transition,
  // and only a live drag (see isDragging) or the very first frame (which
  // has nothing to transition from yet) turn it off.
  const [transitionReady, setTransitionReady] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, rot: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(null);

  function openCase(release, coverEl, color) {
    if (!coverEl) return;
    const rect = coverEl.getBoundingClientRect();
    const startCenterX = rect.left + rect.width / 2;
    const startCenterY = rect.top + rect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    setFlip({
      dx: startCenterX - viewportCenterX,
      dy: startCenterY - viewportCenterY,
      scale: Math.max(rect.width, 1) / EXPANDED_SIZE,
      color,
    });
    setOpenRelease(release);
    setAnimateIn(false);
    setTransitionReady(false);
    setDrag({ x: 0, y: 0, rot: 0 });
    // Double rAF: the first commits the "start" (pre-flip) transform so the
    // browser actually paints it once, the second flips the state so the
    // transition animates from that painted frame to the centred target
    // instead of jumping straight there with nothing to tween from.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnimateIn(true);
      setTransitionReady(true);
    }));
  }

  function closeCase() {
    setAnimateIn(false);
    setDrag({ x: 0, y: 0, rot: 0 });
    window.setTimeout(() => {
      setOpenRelease(null);
      setFlip(null);
      setTransitionReady(false);
    }, 420);
  }

  useEffect(() => {
    if (!openRelease) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') closeCase();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openRelease]);

  function handlePointerDown(e) {
    e.preventDefault();
    draggingRef.current = { startX: e.clientX, startY: e.clientY };
    setIsDragging(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handlePointerMove(e) {
    const origin = draggingRef.current;
    if (!origin) return;
    const dx = e.clientX - origin.startX;
    const dy = e.clientY - origin.startY;
    // Damped and clamped - a nudge, not a full drag-follow: the case
    // should feel like it's being lightly shaken in place, not dragged
    // off across the screen.
    setDrag({
      x: Math.max(-26, Math.min(26, dx * 0.35)),
      y: Math.max(-18, Math.min(18, dy * 0.35)),
      rot: Math.max(-8, Math.min(8, dx * 0.04)),
    });
  }

  function handlePointerUp() {
    draggingRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    setIsDragging(false);
    setDrag({ x: 0, y: 0, rot: 0 });
  }

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    []
  );

  if (releases.length === 0) return null;

  const preFlipTransform = flip ? `translate(${flip.dx}px, ${flip.dy}px) scale(${flip.scale})` : 'none';
  const settledTransform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.rot}deg) scale(1)`;
  const boxTransform = animateIn ? settledTransform : preFlipTransform;
  // Active only once there's a painted frame to tween from, and switched
  // off entirely during a live drag so the case tracks the pointer
  // immediately rather than lagging behind a 420ms easing curve - it
  // should feel grabbed, not chased. The same curve serves both the
  // open/close FLIP and the post-drag spring-back: a touch of overshoot
  // reads as "settling into place" for the FLIP and as a little shake
  // snapping back for the drag release, without needing two curves.
  const boxTransition = transitionReady && !isDragging ? 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';

  // Portalled straight to <body> rather than rendered in place: this page
  // sits inside AppShell's page-enter wrapper, which holds a
  // `transform: translateY(0)` from its own entrance animation
  // indefinitely (fill-mode: both - see the .news-strip comment elsewhere
  // in this codebase for the same mechanism). Any transform other than
  // literally `none`, even an identity translateY(0), creates a new
  // containing block for fixed-position descendants - so a fixed overlay
  // left in place here would center itself against that wrapper's box,
  // not the true viewport. Escaping to <body> sidesteps that entirely.
  const overlay =
    openRelease && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div className="cd-expand-backdrop" onClick={closeCase} aria-hidden="true" />
            <div className="cd-expand" role="dialog" aria-label={openRelease.title}>
              <div
                className={`cd-expand__box${animateIn ? ' cd-expand__box--settled' : ''}`}
                style={{
                  '--case-color': flip.color,
                  transform: boxTransform,
                  transition: boxTransition,
                }}
                onPointerDown={handlePointerDown}
              >
                <img
                  className="cd-expand__img"
                  src={coverUrl(openRelease.id, 1200)}
                  alt={openRelease.title}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button type="button" className="cd-expand__close" onClick={closeCase} aria-label="Close">
                  ×
                </button>
              </div>
              <div className={`cd-expand__caption${animateIn ? ' cd-expand__caption--visible' : ''}`}>
                <h3>{openRelease.title}</h3>
                <span>
                  {typeLabel(openRelease)}
                  {openRelease.firstReleaseDate ? ` · ${openRelease.firstReleaseDate.slice(0, 4)}` : ''}
                </span>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="cd-shelf-wrap">
      <div className="cd-shelf">
        {releases.map((rg, i) => (
          <CDCase key={rg.id} release={rg} isOpen={openRelease?.id === rg.id} onOpen={openCase} index={i} />
        ))}
      </div>
      <div className="cd-shelf__ledge" aria-hidden="true" />
      {overlay}
    </div>
  );
}
