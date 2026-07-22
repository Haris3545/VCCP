import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Cover Art Archive is the keyless counterpart to MusicBrainz's own
// keyless discography lookup (see lib/integrations/musicbrainz.js) - a
// release-group's mbid doubles as its Cover Art Archive key, so the pile
// needs no separate credential the way the Discogs-backed "Releases &
// pressings" section elsewhere on this page does. Not every release-group
// has scanned art archived, so every image load is treated as best-effort
// (see PileCase's onError below) rather than assumed to exist.
function coverUrl(mbid, size) {
  return `https://coverartarchive.org/release-group/${mbid}/front-${size}`;
}

// Fire-and-forget - just gets the browser's own cache warmed up for a URL
// ahead of time (see PileCase's onMouseEnter and useProgressiveCover
// below), nothing to await or clean up.
function preloadImage(src) {
  const img = new Image();
  img.src = src;
}

// The expand overlay used to request the big (1200px) cover image itself,
// fresh, the moment it mounted - a real network + decode round trip
// sitting right in the middle of the FLIP animation, which read as the
// enlarge being slow even though the animation itself was running at full
// speed. This shows the small (250px) cover immediately - already
// downloaded and decoded, since it's the same image the pile case was
// just displaying - then swaps up to the big version only once it's
// actually ready, rather than showing nothing/a blank box while it loads.
function useProgressiveCover(id) {
  const [src, setSrc] = useState(id ? coverUrl(id, 250) : null);
  useEffect(() => {
    if (!id) {
      setSrc(null);
      return undefined;
    }
    setSrc(coverUrl(id, 250));
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSrc(coverUrl(id, 1200));
    };
    img.src = coverUrl(id, 1200);
    return () => {
      cancelled = true;
    };
  }, [id]);
  return src;
}

// Deterministic string hash (djb2), same algorithm as lib/media/helpers'
// hashString - kept local rather than imported cross-feature since it's a
// few lines and this component has no other reason to depend on Media.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h);
}

// Buckets releases into named rows-and-columns sections - albums, then
// singles, then whatever's left (EPs, live albums, compilations, ...) -
// rather than one flat grid in whatever order the API returned them.
// Stable per bucket (Array#sort is a stable sort in every engine this
// project runs on), so releases keep their original relative order within
// a section instead of being re-shuffled by the grouping itself.
function groupReleases(releases) {
  const albums = [];
  const singles = [];
  const other = [];
  for (const rg of releases) {
    const type = rg.primaryType || '';
    if (type === 'Album') albums.push(rg);
    else if (type === 'Single') singles.push(rg);
    else other.push(rg);
  }
  return [
    { label: 'Albums', items: albums },
    { label: 'Singles', items: singles },
    { label: 'Other releases', items: other },
  ].filter((group) => group.items.length > 0);
}

// Fallback spine/cover colour for a release-group whose art hasn't loaded
// (or never loads) yet - deterministic so it's stable across renders, and
// a fixed low lightness so white spine text and the tracklist/insert
// panels always have enough contrast without a per-instance check. Two
// shades (base + deep) so the expanded case's front-cover and back-cover
// gradients have something to run between even before real art loads.
function fallbackColor(id) {
  const hue = hashString(id) % 360;
  return {
    rgb: `hsl(${hue}, 40%, 32%)`,
    rgbDeep: `hsl(${hue}, 46%, 15%)`,
    textDark: false,
    hsl: { h: hue, s: 40, l: 32 },
  };
}

function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

// Averages the loaded cover art down to a single representative colour -
// a cheap, dependency-free stand-in for real dominant-colour extraction
// (no image-processing package in this project, see package.json), close
// enough for a case that only needs to read as "this album's colour"
// rather than reproduce its palette exactly. Returns two shades - a
// lighter one for the top of a gradient, a deeper one for the bottom/
// shadow side - so the expanded case's cover and back-cover panels get a
// two-tone plastic-red-cover-style gradient instead of a flat fill.
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
  r /= n;
  g /= n;
  b /= n;
  const base = { r: Math.round(r * 0.82), g: Math.round(g * 0.82), b: Math.round(b * 0.82) };
  const deep = { r: Math.round(r * 0.48), g: Math.round(g * 0.48), b: Math.round(b * 0.48) };
  return {
    rgb: `rgb(${base.r}, ${base.g}, ${base.b})`,
    rgbDeep: `rgb(${deep.r}, ${deep.g}, ${deep.b})`,
    textDark: relativeLuminance(base.r, base.g, base.b) > 0.45,
    hsl: rgbToHsl(base.r, base.g, base.b),
  };
}

// A handful of distinct spine "voices," each biased toward a colour
// character rather than picked purely at random - the same idea as
// MediaView's masthead fonts (different outlets read differently), just
// driven by the release's own sampled cover colour instead of a hash
// alone: a bright, saturated cover reads as loud/pop; a dark, desaturated
// one reads as moodier/more serious. Multiple options per vibe still get
// hash-picked so two loud covers don't necessarily look identical.
const FONT_VIBES = {
  vivid: [
    { font: "'Archivo Black', var(--font-sans)", weight: 400, style: 'normal', tracking: '0.02em' },
    { font: "'Space Grotesk', var(--font-sans)", weight: 700, style: 'normal', tracking: '0.01em' },
  ],
  moody: [
    { font: "'Playfair Display', var(--font-serif)", weight: 700, style: 'italic', tracking: '0.01em' },
    { font: 'var(--font-serif)', weight: 700, style: 'normal', tracking: '0.02em' },
  ],
  muted: [
    { font: 'var(--font-serif)', weight: 400, style: 'italic', tracking: '0.02em' },
    { font: "'IBM Plex Mono', ui-monospace, monospace", weight: 500, style: 'normal', tracking: '0em' },
  ],
  graphic: [
    { font: "'Oswald', var(--font-sans)", weight: 600, style: 'normal', tracking: '0.03em' },
    { font: "'Space Grotesk', var(--font-sans)", weight: 500, style: 'normal', tracking: '0.01em' },
  ],
};
function pickFontStyle(id, hsl) {
  let vibe;
  if (hsl.l < 30) vibe = 'moody';
  else if (hsl.s < 22) vibe = 'muted';
  else if (hsl.s > 50) vibe = 'vivid';
  else vibe = 'graphic';
  const options = FONT_VIBES[vibe];
  return options[hashString(`${id}font`) % options.length];
}

function typeLabel(rg) {
  if (rg.secondaryTypes?.length) return rg.secondaryTypes[0];
  return rg.primaryType || 'Release';
}

function PileCase({ release, index, isActive, onOpen }) {
  const initial = fallbackColor(release.id);
  const [color, setColor] = useState(initial.rgb);
  const [colorDeep, setColorDeep] = useState(initial.rgbDeep);
  const [textDark, setTextDark] = useState(initial.textDark);
  const [fontStyle, setFontStyle] = useState(pickFontStyle(release.id, initial.hsl));
  const [coverOk, setCoverOk] = useState(true);
  const caseRef = useRef(null);

  function handleLoad(e) {
    try {
      const sampled = sampleDominantColor(e.target);
      setColor(sampled.rgb);
      setColorDeep(sampled.rgbDeep);
      setTextDark(sampled.textDark);
      setFontStyle(pickFontStyle(release.id, sampled.hsl));
    } catch {
      // Tainted canvas (e.g. a CORS hiccup) - keep the hash-based fallback
      // colours, still deterministic and still reads as "this release."
    }
  }

  function handleOpen() {
    onOpen(release, caseRef.current, { rgb: color, rgbDeep: colorDeep });
  }

  return (
    <div
      ref={caseRef}
      className={`pile-case${isActive ? ' pile-case--active' : ''}`}
      style={{
        '--case-color': color,
        '--case-text': textDark ? '#181410' : '#f4f2ea',
        '--case-font': fontStyle.font,
        '--case-font-weight': fontStyle.weight,
        '--case-font-style': fontStyle.style,
        '--case-font-tracking': fontStyle.tracking,
        '--stagger-delay': `${Math.min(index * 28, 380)}ms`,
      }}
      onClick={handleOpen}
      // Hovering is the natural thing that happens before a click (see the
      // lift-to-top lift above), so it's also the moment to start fetching
      // the much bigger expand-view image in the background - by the time
      // a click actually arrives the browser has often already got it
      // cached, instead of only starting that request the moment the
      // expand overlay mounts (see useProgressiveCover).
      onMouseEnter={() => preloadImage(coverUrl(release.id, 1200))}
      role="button"
      tabIndex={0}
      aria-label={`Open ${release.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      <div className="pile-case__enter">
        <div className="pile-case__spine">
          <span>{release.title}</span>
        </div>
        <div className="pile-case__cover">
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

// Intrinsic size of the centred, expanded rig - kept in one place since
// both the CSS (see .cd-expand__stage/__spine/__leaf in globals.css) and
// the FLIP scale math below (openCase) need to agree on the same numbers.
const RIG_W = 340;
const SPINE_W = 28;
const LEAF_W = RIG_W - SPINE_W;
// Not a round 180 - see .cd-expand__flip's own comment in globals.css for
// why a rotateY transition landing on exactly 180deg is worth avoiding.
const HALF_TURN = '179.9deg';
const HINGE_STATES = ['front', 'open', 'back'];
const HINGE_HINTS = {
  front: 'Click to open',
  open: 'Click to close over the back',
  back: 'Click to return to the front',
};

export default function DiscographyShelf({ releaseGroups }) {
  const releases = (releaseGroups || []).slice(0, 30);
  const groups = groupReleases(releases);
  const [openRelease, setOpenRelease] = useState(null);
  const progressiveCoverSrc = useProgressiveCover(openRelease?.id ?? null);
  const [flip, setFlip] = useState(null); // { dx, dy, scale, colors }
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
  // Did the pointer actually move during this press? Set in
  // handlePointerMove, read (and reset) by the rig's own onClick - a click
  // event still fires after a drag's mouseup regardless of how far the
  // pointer travelled in between, so without this a drag-and-release would
  // also cycle the hinge state, which reads as the case opening by itself
  // while you were just trying to nudge it.
  const dragMovedRef = useRef(false);
  // Which of the three physical states the case is in - see HINGE_STATES.
  // Every click of the open case cycles it: front (closed, cover facing
  // you) -> open (cover swings out to reveal the insert; the tray sits
  // still, disc showing) -> back (the tray swings shut over the cover,
  // revealing its own back face - the tracklist) -> back to front.
  const [hingeIndex, setHingeIndex] = useState(0);
  const [bio, setBio] = useState({ status: 'idle', data: null });
  const [tracklist, setTracklist] = useState({ status: 'idle', data: null });

  const hingeState = HINGE_STATES[hingeIndex];

  function openCase(release, caseEl, colors) {
    if (!caseEl) return;
    const rect = caseEl.getBoundingClientRect();
    const startCenterX = rect.left + rect.width / 2;
    const startCenterY = rect.top + rect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    setFlip({
      dx: startCenterX - viewportCenterX,
      dy: startCenterY - viewportCenterY,
      scale: Math.max(rect.width, 1) / RIG_W,
      colors,
    });
    setOpenRelease(release);
    setAnimateIn(false);
    setTransitionReady(false);
    setDrag({ x: 0, y: 0, rot: 0 });
    setHingeIndex(0);
    setBio({ status: 'idle', data: null });
    setTracklist({ status: 'idle', data: null });
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

  function handleRigClick() {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    setHingeIndex((i) => (i + 1) % HINGE_STATES.length);
  }

  useEffect(() => {
    if (!openRelease) return;
    if (hingeState === 'open' && bio.status === 'idle') {
      setBio({ status: 'loading', data: null });
      fetch(`/api/music/bio?title=${encodeURIComponent(openRelease.title)}`)
        .then((r) => r.json())
        .then((result) => setBio({ status: result.source === 'live' ? 'ready' : 'error', data: result }))
        .catch(() => setBio({ status: 'error', data: null }));
    }
    if (hingeState === 'back' && tracklist.status === 'idle') {
      setTracklist({ status: 'loading', data: null });
      fetch(`/api/music/tracklist?id=${encodeURIComponent(openRelease.id)}`)
        .then((r) => r.json())
        .then((result) => setTracklist({ status: result.source === 'live' ? 'ready' : 'error', data: result }))
        .catch(() => setTracklist({ status: 'error', data: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hingeState, openRelease]);

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
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMovedRef.current = true;
    // Damped and clamped - a nudge, not a full drag-follow: the case
    // should feel like it's being lightly shaken in place (in any of its
    // three hinge states), not dragged off across the screen.
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
  const stageTransform = animateIn ? settledTransform : preFlipTransform;
  // Active only once there's a painted frame to tween from, and switched
  // off entirely during a live drag so the case tracks the pointer
  // immediately rather than lagging behind a 420ms easing curve - it
  // should feel grabbed, not chased. The same curve serves both the
  // open/close FLIP and the post-drag spring-back: a touch of overshoot
  // reads as "settling into place" for the FLIP and as a little shake
  // snapping back for the drag release, without needing two curves.
  const stageTransition = transitionReady && !isDragging ? 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';

  // Which leaf paints on top whenever both occupy the same slot (front and
  // back - never open, where they don't overlap) is decided with a plain
  // z-index, not 3D depth - translateZ proved unreliable for this even
  // with an unambiguous separation. front and open deliberately share the
  // same z-index ordering (cover leaf on top) rather than flipping it for
  // open - they don't overlap once open so it doesn't matter for the
  // resting state, but keeping it unchanged means opening never has a
  // z-index swap to glitch on in the first place.
  let spineT = 'translateX(0px)';
  let coverLeafT = 'translateX(0px)';
  let trayLeafT = 'translateX(0px)';
  let coverFlipT = 'rotateY(0deg)';
  let trayFlipT = 'rotateY(0deg)';
  let coverZ = 2;
  let trayZ = 1;
  if (hingeState === 'open') {
    coverFlipT = `rotateY(${HALF_TURN})`;
  } else if (hingeState === 'back') {
    // Both leaves share the same hinge (the spine, at the left edge), so
    // rotating either 180deg alone lands it to the LEFT of the spine -
    // correct for "open" (that's the insert's resting spot), but closing
    // the tray back down there would leave the whole silhouette sitting
    // one leaf-width left of where "front" was. Shifting both leaves right
    // by that width lands them together in the same slot the cover
    // started in - tray on top, showing its back face over the cover's
    // insert face. The spine moves too, all the way past that slot to the
    // far side of it, so it ends up on the right - the side it'd actually
    // be on if you picked the case up and turned it over left-to-right to
    // look at the back.
    spineT = `translateX(${LEAF_W + SPINE_W}px)`;
    coverLeafT = `translateX(${LEAF_W}px)`;
    trayLeafT = `translateX(${LEAF_W}px)`;
    coverFlipT = `rotateY(${HALF_TURN})`;
    trayFlipT = `rotateY(${HALF_TURN})`;
    coverZ = 1;
    trayZ = 2;
  }

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
                className="cd-expand__stage"
                style={{
                  '--case-color': flip.colors.rgb,
                  '--case-color-deep': flip.colors.rgbDeep,
                  transform: stageTransform,
                  transition: stageTransition,
                }}
                onPointerDown={handlePointerDown}
              >
                <div
                  className="cd-expand__rig"
                  onClick={handleRigClick}
                  role="button"
                  tabIndex={0}
                  aria-label={`${openRelease.title} — ${HINGE_HINTS[hingeState]}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRigClick();
                    }
                  }}
                >
                  <div className="cd-expand__spine" style={{ transform: spineT }}>
                    <span>{openRelease.title}</span>
                  </div>

                  <div className="cd-expand__leaf" style={{ transform: coverLeafT, zIndex: coverZ }}>
                    <div className="cd-expand__flip" style={{ transform: coverFlipT }}>
                      <div className="cd-expand__face cd-expand__face--front cd-expand__face--cover">
                        <img
                          className="cd-expand__cover-img"
                          src={progressiveCoverSrc}
                          alt=""
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="cd-expand__face cd-expand__face--back cd-expand__face--insert">
                        <span className="cd-expand__kicker">From the liner notes</span>
                        <h4>{openRelease.title}</h4>
                        {bio.status === 'loading' ? <p className="cd-expand__panel-status">Looking this up…</p> : null}
                        {bio.status === 'error' ? (
                          <p className="cd-expand__panel-status">No Wikipedia page found for this release.</p>
                        ) : null}
                        {bio.status === 'ready' && bio.data ? (
                          <>
                            <p>{bio.data.extract}</p>
                            {bio.data.pageUrl ? (
                              <a href={bio.data.pageUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                Read more on Wikipedia →
                              </a>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="cd-expand__leaf" style={{ transform: trayLeafT, zIndex: trayZ }}>
                    <div className="cd-expand__flip" style={{ transform: trayFlipT }}>
                      <div className="cd-expand__face cd-expand__face--front cd-expand__face--tray">
                        <div className="cd-expand__hub-arch" />
                        <div className="cd-expand__disc-wrap">
                          <div className="cd-expand__disc">
                            <div className="cd-expand__disc-ring" />
                            <div className="cd-expand__disc-hub" />
                          </div>
                        </div>
                      </div>
                      <div className="cd-expand__face cd-expand__face--back cd-expand__face--backcover">
                        <h4>Tracklist</h4>
                        {tracklist.status === 'loading' ? <p className="cd-expand__panel-status">Looking this up…</p> : null}
                        {tracklist.status === 'error' ? (
                          <p className="cd-expand__panel-status">No tracklist found for this release.</p>
                        ) : null}
                        {tracklist.status === 'ready' && tracklist.data ? (
                          <ol className="cd-expand__tracklist">
                            {tracklist.data.tracks.map((t, i) => (
                              <li key={i}>
                                <b>{i + 1}</b>
                                {t.title}
                              </li>
                            ))}
                          </ol>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="cd-expand__close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeCase();
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className={`cd-expand__caption${animateIn ? ' cd-expand__caption--visible' : ''}`}>
                <h3>{openRelease.title}</h3>
                <span>
                  {typeLabel(openRelease)}
                  {openRelease.firstReleaseDate ? ` · ${openRelease.firstReleaseDate.slice(0, 4)}` : ''}
                </span>
                <span className="cd-expand__hint">{HINGE_HINTS[hingeState]}</span>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  let runningIndex = 0;

  return (
    <div className="cd-pile-wrap">
      {groups.map((group) => (
        <div className="cd-pile-group" key={group.label}>
          <div className="eyebrow cd-pile-group__label">{group.label}</div>
          <div className="cd-pile">
            {group.items.map((rg) => {
              const i = runningIndex;
              runningIndex += 1;
              return <PileCase key={rg.id} release={rg} index={i} isActive={openRelease?.id === rg.id} onOpen={openCase} />;
            })}
          </div>
        </div>
      ))}
      {overlay}
    </div>
  );
}
