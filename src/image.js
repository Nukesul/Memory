// Shrinks a photo in the browser before upload: a full size (for the lightbox)
// and a small thumbnail (for grids). A 6 MB phone photo becomes ~150 KB.
async function toBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

function drawTo(src, maxSide, quality) {
  const sw = src.width || src.naturalWidth;
  const sh = src.height || src.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  const encode = (type) => new Promise((res) => canvas.toBlob(res, type, quality));
  return encode('image/webp').then(async (blob) => {
    // Some Safari versions silently return PNG for webp; use JPEG then.
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
    return { blob, w, h };
  });
}

export async function processImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('not-image');
  const bmp = await toBitmap(file);
  const full = await drawTo(bmp, 1400, 0.82);
  const thumb = await drawTo(bmp, 440, 0.76);
  if (bmp.close) bmp.close();
  return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h };
}
