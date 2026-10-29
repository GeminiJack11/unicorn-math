// Memory charms: her own picture and words for a spell, shown whenever that spell is
// tricky. A drawing is kept as pen strokes (palette and pen-size numbers plus points on a
// 1000 × 750 page), not as an image, so saves and backups stay small. Charms can arrive in
// a restored backup file, so everything is checked here before it is kept.

export const PAGE = { w: 1000, h: 750 };
export const INK = ['#2f2545', '#ff4f9a', '#ff9a3c', '#ffd23f', '#3fbf6a', '#3f9bff', '#9b6bff', '#8a5a3c', '#ffffff'];
export const ERASER = INK.length - 1;
export const PENS = [8, 18, 40];
export const TEXT_MAX = 80;
const MAX_STROKES = 120;
const MAX_NUMBERS = 6000;

const isIndex = (v, n) => Number.isInteger(v) && v >= 0 && v < n;

// Returns { strokes, text } with anything unusable dropped, or null if nothing is left.
export function cleanCharm(data) {
  const strokes = [];
  let budget = MAX_NUMBERS;
  for (const s of Array.isArray(data?.strokes) ? data.strokes.slice(0, MAX_STROKES) : []) {
    if (!s || !isIndex(s.c, INK.length) || !isIndex(s.w, PENS.length) || !Array.isArray(s.pts)) continue;
    const pts = [];
    for (let i = 0; i + 1 < s.pts.length && pts.length < budget; i += 2) {
      const x = s.pts[i];
      const y = s.pts[i + 1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      pts.push(Math.round(Math.min(PAGE.w, Math.max(0, x))), Math.round(Math.min(PAGE.h, Math.max(0, y))));
    }
    if (!pts.length) continue;
    budget -= pts.length;
    strokes.push({ c: s.c, w: s.w, pts });
  }
  // Letters, numbers, punctuation and spaces; no control characters.
  const text = String(data?.text ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, TEXT_MAX);
  return strokes.some((s) => s.c !== ERASER) || text ? { strokes, text } : null;
}
