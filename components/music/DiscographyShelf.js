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
// The swap itself used to be the jarring part: img.onload fires once bytes
// are in, but the browser can still be mid-decode, so the very next paint
// - often the first frame or two of the open animation - could show a
// half-decoded/blank image, reading as the cover "reloading" right as it
// grows. img.decode() resolves only once the bitmap is fully ready to
// paint, so the state swap (and the re-render it causes) never lands on
// an undecoded frame.
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
    img.src = coverUrl(id, 1200);
    const swap = () => {
      if (!cancelled) setSrc(coverUrl(id, 1200));
    };
    if (img.decode) {
      img.decode().then(swap).catch(() => {
        // decode() can reject even for an image that will still go on to
        // load fine (e.g. some cross-origin cases) - onload is the
        // fallback path rather than leaving the cover stuck on the small
        // version.
        img.onload = swap;
      });
    } else {
      img.onload = swap;
    }
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

// Punctuation/case-insensitive match key, for the two hardcoded title
// lists below - MusicBrainz titles come through with whatever quote
// style/casing the release was actually tagged with. Apostrophes are
// stripped rather than turned into a separator, so a contraction collapses
// into one word ("today's" -> "todays") instead of splitting into two -
// otherwise "Today's Hits" would normalize to "today s hits" and silently
// fail to match the plain "todays hits" written below.
function titleKey(title) {
  return (title || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// MusicBrainz's discography for this artist includes a handful of entries
// that don't belong in this view at all, or belong somewhere different
// than their own primaryType would put them - not worth a general rule,
// so they're named explicitly instead.
//
// "Today's Hits" is a generic, algorithmically-generated various-artists
// playlist MusicBrainz happens to have indexed with this artist attached -
// not a real release of hers, so it's dropped outright rather than shown
// in any section. Matched by prefix, not exact title: MusicBrainz reindexes
// it under a new dated title periodically ("Today's Hits: June 2022" today,
// presumably some other month next time it's regenerated) - the "Today's
// Hits" part is the only thing that's stable.
const HIDDEN_RELEASE_TITLE_PREFIXES = ['todays hits'].map(titleKey);
// Film-soundtrack work and remix collections, not albums in the ordinary
// sense (MusicBrainz tags them primaryType: Album purely because they're
// full-length releases) - pinned into "Other releases" regardless of type
// so they don't sit alongside her actual studio albums.
const FORCE_OTHER_RELEASE_TITLES = new Set(
  [
    'BOTTOMS: Original Motion Picture Score',
    'Wuthering Heights',
    "Brat and it's completely different but also still brat",
  ].map(titleKey)
);

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
    const key = titleKey(rg.title);
    if (HIDDEN_RELEASE_TITLE_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
    const type = rg.primaryType || '';
    if (FORCE_OTHER_RELEASE_TITLES.has(key)) other.push(rg);
    else if (type === 'Album') albums.push(rg);
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
// (or never loads) yet - deterministic so it's stable across renders. Two
// shades (base + deep) so the expanded case's front-cover and back-cover
// gradients have something to run between even before real art loads.
function fallbackColor(id) {
  const hue = hashString(id) % 360;
  return {
    rgb: `hsl(${hue}, 40%, 32%)`,
    rgbDeep: `hsl(${hue}, 46%, 15%)`,
  };
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
  };
}

function typeLabel(rg) {
  if (rg.secondaryTypes?.length) return rg.secondaryTypes[0];
  return rg.primaryType || 'Release';
}

function PileCase({ release, index, isActive, large, onOpen }) {
  const initial = fallbackColor(release.id);
  const [color, setColor] = useState(initial.rgb);
  const [colorDeep, setColorDeep] = useState(initial.rgbDeep);
  const [coverOk, setCoverOk] = useState(true);
  const caseRef = useRef(null);

  function handleLoad(e) {
    try {
      const sampled = sampleDominantColor(e.target);
      setColor(sampled.rgb);
      setColorDeep(sampled.rgbDeep);
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
      className={`pile-case${large ? ' pile-case--lg' : ''}${isActive ? ' pile-case--active' : ''}`}
      style={{
        '--case-color': color,
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
        <div className="pile-case__spine" />
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
const RIG_W = 400;
const SPINE_W = 33;
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
// Matches .cd-expand__spine/__leaf/__flip's own transition-duration in
// globals.css - kept in sync here so closeCase (below) knows how long the
// hinge takes to settle back to "front" before it's safe to start flying
// the case back to the pile.
const HINGE_DURATION = 820;
const MINIMIZE_DURATION = 260;

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
  // unmounts, so both the open and the close FLIP get the transition -
  // only the very first frame (which has nothing to transition from yet)
  // needs it off.
  const [transitionReady, setTransitionReady] = useState(false);
  // Which of the three physical states the case is in - see HINGE_STATES.
  // Every click of the open case cycles it: front (closed, cover facing
  // you) -> open (cover swings out to reveal the insert; the tray sits
  // still, disc showing) -> back (the tray swings shut over the cover,
  // revealing its own back face - the tracklist) -> back to front.
  const [hingeIndex, setHingeIndex] = useState(0);
  const [bio, setBio] = useState({ status: 'idle', data: null });
  const [tracklist, setTracklist] = useState({ status: 'idle', data: null });
  // The disc itself, spun by dragging it around its own centre (see
  // handleDiscPointerDown below) - separate from hingeIndex, which only
  // ever tracks which of the three physical states the case is in.
  const [discRotation, setDiscRotation] = useState(0);
  const discRef = useRef(null);
  const discSpin = useRef({ dragging: false, lastAngle: 0, lastTime: 0, velocity: 0, raf: null });

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
    setHingeIndex(0);
    setBio({ status: 'idle', data: null });
    setTracklist({ status: 'idle', data: null });
    stopDiscSpin();
    setDiscRotation(0);
    // Double rAF: the first commits the "start" (pre-flip) transform so the
    // browser actually paints it once, the second flips the state so the
    // transition animates from that painted frame to the centred target
    // instead of jumping straight there with nothing to tween from.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnimateIn(true);
      setTransitionReady(true);
    }));
  }

  // Minimising (the FLIP back down into the pile) only ever starts once
  // the case is showing its front cover - closing from 'open' or 'back'
  // first plays the hinge back to 'front' (the same transition a manual
  // click would use) and only *then* flies back, rather than shrinking
  // away mid-open/turned-around, which read as the case vanishing rather
  // than being closed and put away.
  function closeCase() {
    if (hingeIndex !== 0) {
      setHingeIndex(0);
      window.setTimeout(minimizeCase, HINGE_DURATION);
    } else {
      minimizeCase();
    }
  }

  function minimizeCase() {
    setAnimateIn(false);
    window.setTimeout(() => {
      setOpenRelease(null);
      setFlip(null);
      setTransitionReady(false);
    }, MINIMIZE_DURATION);
  }

  function handleRigClick() {
    setHingeIndex((i) => (i + 1) % HINGE_STATES.length);
  }

  function discAngleFromEvent(e) {
    const el = discRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  }

  function stopDiscSpin() {
    if (discSpin.current.raf) {
      cancelAnimationFrame(discSpin.current.raf);
      discSpin.current.raf = null;
    }
    discSpin.current.dragging = false;
  }

  function handleDiscPointerDown(e) {
    // Grabbing the disc is its own gesture, not a click-through to the
    // rig's own hinge-cycling onClick - stopped here on pointerdown, and
    // again on the disc's own onClick below, since pointerdown and click
    // are separate event dispatches (stopping one doesn't stop the other).
    e.preventDefault();
    e.stopPropagation();
    stopDiscSpin();
    discSpin.current.dragging = true;
    discSpin.current.lastAngle = discAngleFromEvent(e);
    discSpin.current.lastTime = performance.now();
    discSpin.current.velocity = 0;
    window.addEventListener('pointermove', handleDiscPointerMove);
    window.addEventListener('pointerup', handleDiscPointerUp);
  }

  function handleDiscPointerMove(e) {
    const spin = discSpin.current;
    if (!spin.dragging) return;
    const angle = discAngleFromEvent(e);
    let delta = angle - spin.lastAngle;
    // Normalize to -PI..PI so crossing the atan2 seam (the angle wrapping
    // from +PI to -PI as the pointer passes due-left of the disc) doesn't
    // register as a huge jump in the wrong direction.
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    const now = performance.now();
    const dt = Math.max(1, now - spin.lastTime);
    const deltaDeg = (delta * 180) / Math.PI;
    spin.velocity = deltaDeg / dt;
    spin.lastAngle = angle;
    spin.lastTime = now;
    setDiscRotation((r) => r + deltaDeg);
  }

  function handleDiscPointerUp() {
    const spin = discSpin.current;
    spin.dragging = false;
    window.removeEventListener('pointermove', handleDiscPointerMove);
    window.removeEventListener('pointerup', handleDiscPointerUp);
    // The disc keeps turning after release and eases down to a stop, like
    // a real disc losing momentum on a spindle, rather than just freezing
    // wherever the pointer happened to let go.
    function decay() {
      spin.velocity *= 0.94;
      setDiscRotation((r) => r + spin.velocity * 16);
      if (Math.abs(spin.velocity) > 0.006) {
        spin.raf = requestAnimationFrame(decay);
      } else {
        spin.raf = null;
      }
    }
    if (Math.abs(spin.velocity) > 0.012) spin.raf = requestAnimationFrame(decay);
  }

  useEffect(() => {
    if (!openRelease) return;
    if (hingeState === 'open' && bio.status === 'idle') {
      setBio({ status: 'loading', data: null });
      fetch(`/api/music/bio?title=${encodeURIComponent(openRelease.title)}&type=${encodeURIComponent(openRelease.primaryType || '')}`)
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

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handleDiscPointerMove);
      window.removeEventListener('pointerup', handleDiscPointerUp);
      stopDiscSpin();
    },
    []
  );

  if (releases.length === 0) return null;

  // A slight lean in the direction of travel - away from centre (then
  // straightening out) while opening, into the pile while closing - rather
  // than a purely straight-line FLIP. Derived from which side of the
  // viewport centre the pile position sits on (flip.dx), clamped to a
  // small angle so it reads as momentum, not a spin.
  const flipTiltDeg = flip ? Math.max(-12, Math.min(12, flip.dx * 0.025)) : 0;
  const preFlipTransform = flip
    ? `translate(${flip.dx}px, ${flip.dy}px) rotate(${flipTiltDeg}deg) scale(${flip.scale})`
    : 'none';
  const settledTransform = 'scale(1)';
  const stageTransform = animateIn ? settledTransform : preFlipTransform;
  // Opening eases out to a clean stop at the centre - a plain deceleration
  // curve, not a spring with overshoot, so arriving reads as a deliberate,
  // polished move rather than a playful bounce. Closing/minimising -
  // animateIn having gone back to false while transitionReady is still
  // true - gets its own quicker ease-in-out: a "zip" back into the pile,
  // still smooth at both ends rather than accelerating the whole way and
  // stopping dead.
  const stageTransition = !transitionReady
    ? 'none'
    : animateIn
      ? 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)'
      : `transform ${MINIMIZE_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1)`;

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
                  <div className="cd-expand__spine" style={{ transform: spineT }} />

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
                        <div
                          className="cd-expand__disc-wrap"
                          ref={discRef}
                          onPointerDown={hingeState === 'open' ? handleDiscPointerDown : undefined}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="cd-expand__disc" style={{ transform: `rotate(${discRotation}deg)` }}>
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
      {groups.map((group) => {
        const isAlbums = group.label === 'Albums';
        return (
          <div className="cd-pile-group" key={group.label}>
            <div className="eyebrow cd-pile-group__label">{group.label}</div>
            <div className={`cd-pile${isAlbums ? ' cd-pile--lg' : ''}`}>
              {group.items.map((rg) => {
                const i = runningIndex;
                runningIndex += 1;
                return (
                  <PileCase key={rg.id} release={rg} index={i} large={isAlbums} isActive={openRelease?.id === rg.id} onOpen={openCase} />
                );
              })}
            </div>
          </div>
        );
      })}
      {overlay}
    </div>
  );
}
