// Shrinks a photo in the browser before upload, so the free storage lasts:
//  - full: up to 1600 px on the long side, quality chosen automatically to stay near 250 KB
//  - thumb: 480 px, used in grids and cards
// A 6 MB phone photo usually becomes 150-300 KB and still looks sharp on a phone or laptop.
const FULL_SIDE = 1600;
const THUMB_SIDE = 480;
const FULL_BUDGET = 260 * 1024; // target size for the full photo
const THUMB_BUDGET = 45 * 1024;

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

const sizeOf = (src) => [src.width || src.naturalWidth, src.height || src.naturalHeight];

// Shrinks in steps of at most 2x. One big jump looks jagged, several smaller ones look smooth.
function scaled(src, maxSide) {
  const [sw, sh] = sizeOf(src);
  const k = Math.min(1, maxSide / Math.max(sw, sh));
  const tw = Math.max(1, Math.round(sw * k));
  const th = Math.max(1, Math.round(sh * k));
  let cur = src;
  let cw = sw;
  let ch = sh;
  while (cw / 2 > tw && ch / 2 > th) {
    const nw = Math.round(cw / 2);
    const nh = Math.round(ch / 2);
    const step = document.createElement('canvas');
    step.width = nw;
    step.height = nh;
    const sctx = step.getContext('2d');
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(cur, 0, 0, nw, nh);
    cur = step;
    cw = nw;
    ch = nh;
  }
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cur, 0, 0, tw, th);
  return canvas;
}

const encode = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

function flatten(canvas) {
  // JPEG has no transparency: put the picture on white.
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(canvas, 0, 0);
  return c;
}

// Finds the highest quality that fits the size budget (WebP, JPEG as a fallback).
async function fit(canvas, budget, { qMax, qMin }) {
  let type = 'image/webp';
  let src = canvas;
  let probe = await encode(canvas, type, qMax);
  if (!probe || probe.type !== 'image/webp') {
    // Some Safari versions silently return PNG for webp.
    type = 'image/jpeg';
    src = flatten(canvas);
    probe = await encode(src, type, qMax);
  }
  if (probe.size <= budget) return probe;
  let lo = qMin;
  let hi = qMax;
  let best = await encode(src, type, qMin);
  for (let i = 0; i < 4; i++) {
    const mid = (lo + hi) / 2;
    const b = await encode(src, type, mid);
    if (b.size <= budget) {
      best = b;
      lo = mid;
    } else hi = mid;
  }
  return best;
}

export async function processImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('not-image');
  const bmp = await toBitmap(file);
  try {
    let side = FULL_SIDE;
    let canvas = scaled(bmp, side);
    let full = await fit(canvas, FULL_BUDGET, { qMax: 0.88, qMin: 0.66 });
    // Very detailed photos: if even the lowest quality is too big, use fewer pixels instead.
    while (full.size > FULL_BUDGET * 1.6 && side > 1100) {
      side -= 250;
      canvas = scaled(bmp, side);
      full = await fit(canvas, FULL_BUDGET, { qMax: 0.82, qMin: 0.66 });
    }
    const thumbCanvas = scaled(bmp, THUMB_SIDE);
    const thumb = await fit(thumbCanvas, THUMB_BUDGET, { qMax: 0.82, qMin: 0.6 });
    return { full, thumb, w: canvas.width, h: canvas.height };
  } finally {
    if (bmp.close) bmp.close();
  }
}

// ───────── Posts ─────────
// Every post photo is stored in three sizes, so each screen downloads only what it shows:
//  - full:  2048 px, opened in full screen (≈ 500 KB)
//  - feed:  1080 px, shown in the feed (≈ 170 KB)
//  - thumb:  480 px, grids and previews (≈ 45 KB)
// "Keep the original" adds the photo at its full resolution (capped by what phones can draw,
// about 16 megapixels) at high quality. It is re-encoded, which also strips camera data such as
// the location where the photo was taken.
const POST_SIZES = [
  { key: 'full', side: 2048, budget: 500 * 1024, q: { qMax: 0.9, qMin: 0.7 } },
  { key: 'feed', side: 1080, budget: 170 * 1024, q: { qMax: 0.86, qMin: 0.64 } },
  { key: 'thumb', side: 480, budget: 45 * 1024, q: { qMax: 0.82, qMin: 0.6 } },
];
const ORIG_MAX_PIXELS = 16e6;
const ORIG_BUDGET = 9.5 * 1024 * 1024;

export async function processPostImage(file, { original = false } = {}) {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name || '')) throw new Error('not-image');
  const bmp = await toBitmap(file);
  try {
    const [sw, sh] = sizeOf(bmp);
    const out = {};
    let w = 0;
    let h = 0;
    for (const s of POST_SIZES) {
      const canvas = scaled(bmp, s.side);
      let blob = await fit(canvas, s.budget, s.q);
      // Very detailed photos: fewer pixels instead of a blurry low quality.
      let side = s.side;
      let c = canvas;
      while (blob.size > s.budget * 1.5 && side > s.side * 0.6) {
        side = Math.round(side * 0.85);
        c = scaled(bmp, side);
        blob = await fit(c, s.budget, s.q);
      }
      out[s.key] = blob;
      if (s.key === 'full') {
        w = c.width;
        h = c.height;
      }
    }
    if (original) {
      const k = Math.min(1, Math.sqrt(ORIG_MAX_PIXELS / (sw * sh)));
      const side = Math.round(Math.max(sw, sh) * k);
      if (side > 2048) {
        const canvas = scaled(bmp, side);
        const blob = await fit(canvas, ORIG_BUDGET, { qMax: 0.92, qMin: 0.8 });
        if (blob && blob.size <= ORIG_BUDGET) out.orig = blob;
      }
    }
    return { ...out, w, h };
  } finally {
    if (bmp.close) bmp.close();
  }
}
