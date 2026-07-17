// Light-touch client-side compression: resize down only if the image is
// larger than a sensible display size, and re-encode at a high JPEG
// quality (barely visible loss) rather than aggressively squeezing the
// file. PNGs stay PNG (quality is lossless there regardless of the
// canvas quality argument) so transparency and small graphics aren't
// degraded - only their dimensions shrink if they're oversized.
const MAX_DIMENSION = 1600;
const INITIAL_JPEG_QUALITY = 0.9;
const MIN_JPEG_QUALITY = 0.5;
const MIN_DIMENSION = 800;
// Stay comfortably under Vercel's ~4.5MB request-body limit once these
// bytes are base64-encoded (~1.37x inflation) and wrapped in JSON.
const TARGET_BYTES = 2.5 * 1024 * 1024;

function renderAt(img, dimension, outputType, quality) {
  const scale = Math.min(1, dimension / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image'))),
      outputType,
      outputType === 'image/jpeg' ? quality : undefined
    );
  });
}

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const canReduceQuality = outputType === 'image/jpeg';

        let dimension = MAX_DIMENSION;
        let quality = INITIAL_JPEG_QUALITY;
        let blob = await renderAt(img, dimension, outputType, quality);

        // Busy, high-detail photos (fine text, texture) don't compress
        // nearly as much as smooth ones at a fixed quality - if a single
        // light pass isn't enough, back off further (quality first, then
        // dimension) rather than shipping something too big to upload.
        while (
          blob.size > TARGET_BYTES &&
          ((canReduceQuality && quality > MIN_JPEG_QUALITY) || dimension > MIN_DIMENSION)
        ) {
          if (canReduceQuality && quality > MIN_JPEG_QUALITY) {
            quality = Math.max(MIN_JPEG_QUALITY, quality - 0.15);
          } else {
            dimension = Math.max(MIN_DIMENSION, Math.round(dimension * 0.8));
          }
          blob = await renderAt(img, dimension, outputType, quality);
        }

        resolve(new File([blob], file.name, { type: outputType }));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load that image'));
    };

    img.src = url;
  });
}
