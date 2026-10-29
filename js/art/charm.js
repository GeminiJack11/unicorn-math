// Draws one of her memory charms. Only numbers checked by cleanCharm and colors from the
// fixed palette ever reach the markup.
import { PAGE, INK, PENS } from '../engine/charms.js';

const mid = (a, b) => Math.round((a + b) / 2);

// A smooth line through the points (a single point becomes a dot).
export function strokePath(pts) {
  if (pts.length <= 2) return `M${pts[0]} ${pts[1]} l0.1 0`;
  let d = `M${pts[0]} ${pts[1]}`;
  for (let i = 2; i + 3 < pts.length; i += 2) d += ` Q${pts[i]} ${pts[i + 1]} ${mid(pts[i], pts[i + 2])} ${mid(pts[i + 1], pts[i + 3])}`;
  return `${d} L${pts[pts.length - 2]} ${pts[pts.length - 1]}`;
}

export const strokeAttrs = (s) => `stroke="${INK[s.c]}" stroke-width="${PENS[s.w]}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

export function charmSVG(charm, label = 'her drawing') {
  return `<svg class="charm-art" viewBox="0 0 ${PAGE.w} ${PAGE.h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><rect width="${PAGE.w}" height="${PAGE.h}" rx="40" fill="#ffffff"/>${charm.strokes.map((s) => `<path d="${strokePath(s.pts)}" ${strokeAttrs(s)}/>`).join('')}</svg>`;
}
