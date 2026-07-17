// Light-touch client-side compression: resize down only if the image is
// larger than a sensible display size, and re-encode at a high JPEG
// quality (barely visible loss) rather than aggressively squeezing the
// file. PNGs stay PNG (quality is lossless there regardless of the
// canvas quality argument) so transparency and small graphics aren't
// degraded - only their dimensions shrink if they're oversized.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.9;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not process that image'));
            return;
          }
          resolve(new File([blob], file.name, { type: outputType }));
        },
        outputType,
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load that image'));
    };

    img.src = url;
  });
}
