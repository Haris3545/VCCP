// Samples the actual fixed background photo behind a glass element and
// exposes the average colour as --tint-r/--tint-g/--tint-b (plus warm/cool/
// green-shifted variants of it), so the glass's colour genuinely comes from
// whatever's behind it — the photo — rather than a fixed decorative palette.
// This only works out cheaply because both the photo (.app-bg-photo) and
// every glass surface (the floating nav, the ticker) are position:fixed, so
// the relationship between "this element's screen rect" and "this region of
// the photo" is constant across scrolling and only needs recomputing on
// resize, not every frame.
const PHOTO_SRC = '/media/dashboard-bg.jpg';
// Mirrors .app-bg-photo's `background-position: 78% 22%` in globals.css.
const PHOTO_POSITION = { x: 0.78, y: 0.22 };

let photoPromise = null;
function loadPhoto() {
  if (!photoPromise) {
    photoPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = PHOTO_SRC;
    });
  }
  return photoPromise;
}

// Mirrors CSS `background-size: cover; background-position: 78% 22%;` —
// maps the viewport onto the source image so a given screen rect can be
// translated into the matching region of the photo.
function coverMap(imgW, imgH, viewportW, viewportH) {
  const scale = Math.max(viewportW / imgW, viewportH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  return {
    scale,
    offsetX: (viewportW - drawW) * PHOTO_POSITION.x,
    offsetY: (viewportH - drawH) * PHOTO_POSITION.y,
  };
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function attachAdaptiveTint(el) {
  if (!el || typeof window === 'undefined') return () => {};

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let img = null;
  let cancelled = false;

  function sample() {
    if (!img || cancelled) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const { scale, offsetX, offsetY } = coverMap(img.naturalWidth, img.naturalHeight, window.innerWidth, window.innerHeight);
    const sx = Math.max(0, (rect.left - offsetX) / scale);
    const sy = Math.max(0, (rect.top - offsetY) / scale);
    const sw = Math.min(img.naturalWidth - sx, Math.max(1, rect.width / scale));
    const sh = Math.min(img.naturalHeight - sy, Math.max(1, rect.height / scale));

    const size = 20;
    canvas.width = size;
    canvas.height = size;
    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
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

      el.style.setProperty('--tint-r', r.toFixed(0));
      el.style.setProperty('--tint-g', g.toFixed(0));
      el.style.setProperty('--tint-b', b.toFixed(0));
      // Three cheap hue-shifted variants (boost one channel, pull back the
      // others) standing in for how a prism splits one source colour into a
      // spread, rather than three arbitrary fixed hues.
      el.style.setProperty('--tint-cool-r', clamp255(r * 0.75));
      el.style.setProperty('--tint-cool-g', clamp255(g * 0.9));
      el.style.setProperty('--tint-cool-b', clamp255(b * 1.35 + 40));
      el.style.setProperty('--tint-warm-r', clamp255(r * 1.35 + 40));
      el.style.setProperty('--tint-warm-g', clamp255(g * 0.85));
      el.style.setProperty('--tint-warm-b', clamp255(b * 0.8));
      el.style.setProperty('--tint-green-r', clamp255(r * 0.8));
      el.style.setProperty('--tint-green-g', clamp255(g * 1.3 + 30));
      el.style.setProperty('--tint-green-b', clamp255(b * 0.85));
    } catch {
      // Same-origin canvas read should never actually throw here, but if a
      // future change swaps in a remote image URL, fail quiet and keep
      // whatever tint (or fallback default) is already set.
    }
  }

  loadPhoto()
    .then((loaded) => {
      if (cancelled) return;
      img = loaded;
      sample();
    })
    .catch(() => {});

  window.addEventListener('resize', sample);
  return () => {
    cancelled = true;
    window.removeEventListener('resize', sample);
  };
}
