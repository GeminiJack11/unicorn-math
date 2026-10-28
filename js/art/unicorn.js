// Her unicorn, drawn as one SVG from the look she chose. `age` (0 foal … 1 grown) changes
// the proportions, and wings appear once every spell is learned.
import { resolveLook } from './catalog.js';
import { mix, shade, lum, RAINBOW } from './color.js';

let uid = 0;
const r1 = (n) => Math.round(n * 10) / 10;
const P = (x, y) => `${r1(x)} ${r1(y)}`;
const deg = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// Hats draw behind the horn; each number is how far above the head's center (in head
// radii) the hat reaches, so a head-only portrait leaves room for it.
const HATS = { party: 2.12, witch: 2.22, crown: 1.66 };

function geometry(age) {
  const a = Math.max(0, Math.min(1, age));
  const ground = 290;
  const legLen = 44 + 22 * a;
  const bodyRx = 58 + 12 * a;
  const bodyRy = 39 + 7 * a;
  const bodyCx = 146;
  const bodyCy = ground - legLen - bodyRy * 0.5;
  const headR = 51 - 4 * a;
  const headCx = bodyCx + bodyRx * 0.8 + 15;
  const headCy = bodyCy - bodyRy - headR * 0.6;
  return { a, ground, legLen, bodyRx, bodyRy, bodyCx, bodyCy, headR, headCx, headCy,
    legW: 18 + 4 * a, hornLen: headR * (0.6 + 0.45 * a) };
}

// A lock of hair: a curved teardrop from (x, y) toward `ang`, bending sideways by `bend`.
function lock(x, y, ang, len, wid, bend) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const px = -dy;
  const py = dx;
  const tip = [x + dx * len + px * bend, y + dy * len + py * bend];
  const a = [x + (px * wid) / 2, y + (py * wid) / 2];
  const b = [x - (px * wid) / 2, y - (py * wid) / 2];
  const c1 = [x + dx * len * 0.55 + px * (wid * 0.7 + bend * 0.5), y + dy * len * 0.55 + py * (wid * 0.7 + bend * 0.5)];
  const c2 = [x + dx * len * 0.55 - px * (wid * 0.45 - bend * 0.6), y + dy * len * 0.55 - py * (wid * 0.45 - bend * 0.6)];
  return `M${P(...a)} Q${P(...c1)} ${P(...tip)} Q${P(...c2)} ${P(...b)} Z`;
}

function legPath(x, top, bottom, w) {
  const r = w / 2;
  return `M${P(x - r, top)} L${P(x - r, bottom - 7)} Q${P(x - r, bottom)} ${P(x - r + 7, bottom)} L${P(x + r - 7, bottom)} Q${P(x + r, bottom)} ${P(x + r, bottom - 7)} L${P(x + r, top)} Z`;
}

function hoofPath(x, bottom, w) {
  const r = w / 2 + 1;
  const h = 13;
  return `M${P(x - r, bottom - h)} L${P(x - r, bottom - 6)} Q${P(x - r, bottom)} ${P(x - r + 6, bottom)} L${P(x + r - 6, bottom)} Q${P(x + r, bottom)} ${P(x + r, bottom - 6)} L${P(x + r, bottom - h)} Z`;
}

export function star(cx, cy, r, points = 5, inner = 0.48) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r;
    const ang = -Math.PI / 2 + (i * Math.PI) / points;
    d += `${i ? 'L' : 'M'}${P(cx + rad * Math.cos(ang), cy + rad * Math.sin(ang))}`;
  }
  return `${d}Z`;
}

export function heart(cx, cy, s) {
  return `M${P(cx, cy + s * 0.9)} C${P(cx - s * 1.3, cy)} ${P(cx - s * 0.6, cy - s * 0.95)} ${P(cx, cy - s * 0.3)} C${P(cx + s * 0.6, cy - s * 0.95)} ${P(cx + s * 1.3, cy)} ${P(cx, cy + s * 0.9)}Z`;
}

function sparkle(cx, cy, s) {
  return `M${P(cx, cy - s)} Q${P(cx + s * 0.15, cy - s * 0.15)} ${P(cx + s, cy)} Q${P(cx + s * 0.15, cy + s * 0.15)} ${P(cx, cy + s)} Q${P(cx - s * 0.15, cy + s * 0.15)} ${P(cx - s, cy)} Q${P(cx - s * 0.15, cy - s * 0.15)} ${P(cx, cy - s)}Z`;
}

export function unicornSVG(look, { age = 1, wings = false, mood = 'happy', crop = 'full', horn = true, cls = '', label = 'unicorn', attrs = '' } = {}) {
  const L = resolveLook(look);
  const id = `u${++uid}`;
  const g = geometry(age);
  const coat = L.coat;
  const outline = mix(shade(coat, -0.6), '#4b2a7a', 0.45);
  const mane = L.mane;
  const hornColor = L.horn === 'rainbow' ? '#ffd56b' : L.horn;
  const glitter = L.hoof === 'glitter';
  const hoof = glitter ? `url(#${id}-hoof)` : L.hoof ? L.hoof : mix(hornColor, outline, 0.3);
  const farHoof = glitter ? hoof : shade(hoof, -0.08);
  const stroke = `stroke="${outline}" stroke-width="3" stroke-linejoin="round"`;
  const { headCx: hx, headCy: hy, headR: R, bodyCx: bx, bodyCy: by, bodyRx: brx, bodyRy: bry } = g;
  const headPt = (angDeg, k = 1) => [hx + R * k * Math.cos(deg(angDeg)), hy + R * k * Math.sin(deg(angDeg))];

  // Neck corners, shared by the neck shape and the necklaces.
  const nb1 = [bx + brx * 0.22, by - bry * 0.9];
  const nh1 = [hx - R * 0.78, hy + R * 0.12];
  const nh2 = [hx + R * 0.12, hy + R * 0.82];
  const nb2 = [bx + brx * 0.92, by - bry * 0.22];
  const neck = `M${P(...nb1)} Q${P(hx - R * 1.0, by - bry * 1.05)} ${P(...nh1)} L${P(...nh2)} Q${P(hx + R * 0.05, by - bry * 0.45)} ${P(...nb2)} Z`;

  const legTop = by + bry * 0.2;
  const nearLegs = [bx + brx * 0.5, bx - brx * 0.52];
  const farLegs = [bx + brx * 0.26, bx - brx * 0.76];
  const muzzle = { cx: hx + R * 0.6, cy: hy + R * 0.36, rx: R * 0.54, ry: R * 0.43 };
  // A head-only portrait (for icons and friends) ends in a rounded neck instead of a body.
  const headOnly = crop === 'head';
  const stub = `M${P(...nh1)} Q${P(hx - R * 0.98, hy + R * 0.75)} ${P(hx - R * 0.72, hy + R * 1.32)} Q${P(hx - R * 0.25, hy + R * 1.5)} ${P(hx + R * 0.28, hy + R * 1.22)} L${P(...nh2)} Z`;

  const headShapes = [
    `<circle cx="${r1(hx)}" cy="${r1(hy)}" r="${r1(R)}"/>`,
    `<ellipse cx="${r1(muzzle.cx)}" cy="${r1(muzzle.cy)}" rx="${r1(muzzle.rx)}" ry="${r1(muzzle.ry)}"/>`,
  ];
  const shapes = (headOnly ? [`<path d="${stub}"/>`, ...headShapes] : [
    `<ellipse cx="${r1(bx)}" cy="${r1(by)}" rx="${r1(brx)}" ry="${r1(bry)}"/>`,
    `<path d="${neck}"/>`,
    ...headShapes,
    ...nearLegs.map((x) => `<path d="${legPath(x, legTop, g.ground, g.legW)}"/>`),
  ]).join('');

  const parts = [];
  // Gradients and the body clip used for patterns.
  const hornStops = L.horn === 'rainbow'
    ? RAINBOW.map((c, i) => `<stop offset="${(i / (RAINBOW.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')
    : `<stop offset="0" stop-color="${shade(hornColor, -0.08)}"/><stop offset="1" stop-color="${shade(hornColor, 0.55)}"/>`;
  parts.push(`<defs>
    <linearGradient id="${id}-horn" x1="0" y1="1" x2="0.3" y2="0">${hornStops}</linearGradient>
    <linearGradient id="${id}-wing" x1="0" y1="1" x2="0.4" y2="0"><stop offset="0" stop-color="${mix(mane[0], '#ffffff', 0.55)}"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <clipPath id="${id}-body"><ellipse cx="${r1(bx)}" cy="${r1(by)}" rx="${r1(brx)}" ry="${r1(bry)}"/></clipPath>${glitter ? `
    <linearGradient id="${id}-hoof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb3e0"/><stop offset="0.5" stop-color="#d4b8ff"/><stop offset="1" stop-color="#9fdcff"/></linearGradient>` : ''}
  </defs>`);

  // Tail.
  if (!headOnly) {
    const x = bx - brx * 0.93;
    const y = by - bry * 0.2;
    const s = 0.8 + 0.2 * g.a;
    parts.push(`<g class="u-tail" style="transform-origin:${r1(x)}px ${r1(y)}px">${tailSVG(L.hair, x, y, s, mane, stroke, outline)}</g>`);
  }

  const wingPath = (wx, wy, s) => `M${P(wx, wy)} C${P(wx - 6 * s, wy - 52 * s)} ${P(wx - 58 * s, wy - 82 * s)} ${P(wx - 92 * s, wy - 66 * s)} Q${P(wx - 74 * s, wy - 52 * s)} ${P(wx - 84 * s, wy - 40 * s)} Q${P(wx - 60 * s, wy - 34 * s)} ${P(wx - 68 * s, wy - 18 * s)} Q${P(wx - 42 * s, wy - 14 * s)} ${P(wx - 44 * s, wy + 2 * s)} Q${P(wx - 20 * s, wy + 6 * s)} ${P(wx, wy)}Z`;
  if (wings && !headOnly) parts.push(`<path d="${wingPath(bx + brx * 0.18, by - bry * 0.72, 0.95)}" fill="${shade(mix(mane[0], '#ffffff', 0.6), -0.06)}" ${stroke}/>`);

  // Far legs sit a little behind and in shadow.
  const farFill = shade(coat, -0.08);
  for (const x of headOnly ? [] : farLegs) {
    parts.push(`<path d="${legPath(x, legTop, g.ground - 4, g.legW)}" fill="${farFill}" ${stroke}/>`);
    parts.push(`<path d="${hoofPath(x, g.ground - 4, g.legW)}" fill="${farHoof}" ${stroke}/>`);
  }

  // One merged silhouette: a thick outline pass, then the coat on top.
  parts.push(`<g fill="${outline}" stroke="${outline}" stroke-width="6" stroke-linejoin="round">${shapes}</g>`);
  parts.push(`<g fill="${coat}">${shapes}</g>`);
  if (!headOnly) {
    parts.push(`<ellipse cx="${r1(bx)}" cy="${r1(by + bry * 0.62)}" rx="${r1(brx * 0.8)}" ry="${r1(bry * 0.38)}" fill="${shade(coat, -0.05)}" clip-path="url(#${id}-body)"/>`);
    for (const x of nearLegs) parts.push(`<path d="${hoofPath(x, g.ground, g.legW)}" fill="${hoof}" ${stroke}/>`);
    if (glitter) {
      for (const x of nearLegs) {
        parts.push(`<path d="${sparkle(x - g.legW * 0.12, g.ground - 7, 3.2)}" fill="#ffffff"/><circle cx="${r1(x + g.legW * 0.22)}" cy="${r1(g.ground - 4)}" r="1.3" fill="#ffffff"/>`);
      }
    }
  }
  parts.push(`<ellipse cx="${r1(muzzle.cx + R * 0.04)}" cy="${r1(muzzle.cy + R * 0.04)}" rx="${r1(muzzle.rx * 0.82)}" ry="${r1(muzzle.ry * 0.78)}" fill="${mix(coat, '#ffc6de', 0.35)}"/>`);

  if (!headOnly || L.pattern === 'freckles') parts.push(patternSVG(L.pattern, g, id, coat, mane));
  if (!headOnly) {
    parts.push(outfitSVG(L.outfit, g, nb1, nb2, nh2, outline));
    parts.push(tailBowSVG(L.tail, bx - brx * 0.93, by - bry * 0.2, 0.8 + 0.2 * g.a, outline));
  }

  parts.push(maneSVG(L.hair, g, headOnly, mane, stroke, outline));

  // Ear.
  {
    const base = [hx - R * 0.36, hy - R * 0.74];
    const tip = [hx - R * 0.6, hy - R * 1.42];
    const inTip = lerp(tip, base, 0.22);
    parts.push(`<path d="M${P(base[0] - R * 0.2, base[1] + R * 0.1)} Q${P(base[0] - R * 0.42, base[1] - R * 0.42)} ${P(...tip)} Q${P(base[0] + R * 0.06, base[1] - R * 0.38)} ${P(base[0] + R * 0.22, base[1] + R * 0.04)} Z" fill="${coat}" ${stroke}/>`);
    parts.push(`<path d="M${P(base[0] - R * 0.1, base[1] + R * 0.02)} Q${P(base[0] - R * 0.3, base[1] - R * 0.34)} ${P(...inTip)} Q${P(base[0] + R * 0.02, base[1] - R * 0.3)} ${P(base[0] + R * 0.1, base[1] - R * 0.02)} Z" fill="${mix(coat, '#ff9cc9', 0.45)}"/>`);
  }

  // Hats sit behind the horn, so it pokes up through them.
  if (HATS[L.head]) parts.push(headSVG(L.head, headPt, R, outline));

  if (horn) {
    const hb = [hx + R * 0.06, hy - R * 0.86];
    const ang = deg(-70);
    const d = [Math.cos(ang), Math.sin(ang)];
    const p = [-d[1], d[0]];
    const w = R * 0.18;
    const tip = [hb[0] + d[0] * g.hornLen, hb[1] + d[1] * g.hornLen];
    const left = [hb[0] - p[0] * w, hb[1] - p[1] * w];
    const right = [hb[0] + p[0] * w, hb[1] + p[1] * w];
    const under = [hb[0] - d[0] * w * 0.6, hb[1] - d[1] * w * 0.6];
    parts.push(`<path d="M${P(...left)} L${P(...tip)} L${P(...right)} Q${P(...under)} ${P(...left)} Z" fill="url(#${id}-horn)" ${stroke}/>`);
    for (const k of [0.25, 0.48, 0.7]) {
      const c = [hb[0] + d[0] * g.hornLen * k, hb[1] + d[1] * g.hornLen * k];
      const hw = w * (1 - k) * 1.02;
      parts.push(`<path d="M${P(c[0] - p[0] * hw + d[0] * 2, c[1] - p[1] * hw + d[1] * 2)} L${P(c[0] + p[0] * hw - d[0] * 3, c[1] + p[1] * hw - d[1] * 3)}" stroke="${outline}" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>`);
    }
  }

  parts.push(faceSVG(g, L, outline, mood, coat));

  // Forelock falls over the forehead, in front of the horn's base.
  parts.push(forelockSVG(L.hair, g, mane, stroke, outline));

  if (wings && !headOnly) parts.push(`<path d="${wingPath(bx + brx * 0.02, by - bry * 0.62, 1)}" fill="url(#${id}-wing)" ${stroke}/>`);

  if (!headOnly) parts.push(neckSVG(L.neck, nb1, nh1, nb2, nh2, outline));
  if (!HATS[L.head]) parts.push(headSVG(L.head, headPt, R, outline));

  let viewBox = '0 0 300 300';
  if (headOnly) {
    const top = Math.min(hy - R * 0.86 - g.hornLen * 0.97, hy - R * (HATS[L.head] || 1.45)) - 6;
    const left = hx - R * 1.85;
    const size = Math.max(hx + R * 1.32 - left, hy + R * 1.54 - top);
    viewBox = `${r1(left)} ${r1(top)} ${r1(size)} ${r1(size)}`;
  }
  return `<svg class="unicorn ${cls}" viewBox="${viewBox}" ${attrs} role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

function faceSVG(g, L, outline, mood, coat) {
  const { headCx: hx, headCy: hy, headR: R } = g;
  const ex = hx + R * 0.2;
  const ey = hy - R * 0.04;
  const erx = R * 0.18;
  const ery = R * 0.25;
  const out = [];
  const lashes = L.face === 'lashes';
  if (L.face === 'hearteyes' || L.face === 'stareyes') {
    // Special eyes win over the happy closed-eye look: she picked them to be seen.
    const shape = L.face === 'hearteyes'
      ? `<path d="${heart(ex, ey - ery * 0.08, R * 0.3)}" fill="#ff4f9a" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>`
      : `<path d="${star(ex, ey, R * 0.34, 5, 0.5)}" fill="#ffc93c" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>`;
    out.push(`<g class="u-eye" style="transform-origin:${r1(ex)}px ${r1(ey)}px">${shape}
      <circle cx="${r1(ex + erx * 0.3)}" cy="${r1(ey - ery * 0.3)}" r="${r1(erx * 0.3)}" fill="#ffffff"/></g>`);
    out.push(`<path d="M${P(ex + erx * 0.75, ey - ery * 0.95)} l7 -7 M${P(ex + erx * 1.1, ey - ery * 0.6)} l8 -3" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>`);
  } else if (mood === 'joy') {
    out.push(`<path d="M${P(ex - erx, ey + ery * 0.2)} Q${P(ex, ey - ery * 0.9)} ${P(ex + erx, ey + ery * 0.2)}" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>`);
    if (lashes) out.push(`<path d="M${P(ex + erx * 0.55, ey - ery * 0.38)} q4 -4 10 -6 M${P(ex + erx * 0.95, ey - ery * 0.02)} q5 -1 10 0" fill="none" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>`);
  } else {
    const ring = lum(coat) < 0.25 ? `<ellipse cx="${r1(ex)}" cy="${r1(ey)}" rx="${r1(erx + 2.5)}" ry="${r1(ery + 2.5)}" fill="#ffffff" opacity="0.85"/>` : '';
    out.push(`<g class="u-eye" style="transform-origin:${r1(ex)}px ${r1(ey)}px">${ring}
      <ellipse cx="${r1(ex)}" cy="${r1(ey)}" rx="${r1(erx)}" ry="${r1(ery)}" fill="${shade(L.eye, -0.45)}"/>
      <ellipse cx="${r1(ex)}" cy="${r1(ey + ery * 0.2)}" rx="${r1(erx * 0.8)}" ry="${r1(ery * 0.68)}" fill="${L.eye}"/>
      <ellipse cx="${r1(ex + erx * 0.05)}" cy="${r1(ey - ery * 0.02)}" rx="${r1(erx * 0.44)}" ry="${r1(ery * 0.48)}" fill="#1f1433"/>
      <circle cx="${r1(ex + erx * 0.32)}" cy="${r1(ey - ery * 0.36)}" r="${r1(erx * 0.4)}" fill="#ffffff"/>
      <circle cx="${r1(ex - erx * 0.3)}" cy="${r1(ey + ery * 0.42)}" r="${r1(erx * 0.18)}" fill="#ffffff" opacity="0.9"/>
    </g>`);
    if (lashes) {
      const k = R / 40;
      out.push(`<path d="M${P(ex - erx * 0.15, ey - ery * 0.98)} q${r1(k)} ${r1(-6 * k)} ${r1(5 * k)} ${r1(-11 * k)} M${P(ex + erx * 0.45, ey - ery * 0.9)} q${r1(4 * k)} ${r1(-5 * k)} ${r1(11 * k)} ${r1(-8 * k)} M${P(ex + erx * 0.88, ey - ery * 0.5)} q${r1(6 * k)} ${r1(-2 * k)} ${r1(12 * k)} ${r1(-1 * k)}" fill="none" stroke="${outline}" stroke-width="3.4" stroke-linecap="round"/>`);
    } else {
      out.push(`<path d="M${P(ex + erx * 0.55, ey - ery * 0.82)} l7 -7 M${P(ex + erx * 0.92, ey - ery * 0.5)} l8 -3" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>`);
    }
  }
  out.push(`<ellipse cx="${r1(hx + R * 0.44)}" cy="${r1(hy + R * 0.3)}" rx="${r1(R * 0.16)}" ry="${r1(R * 0.09)}" fill="#ff8fc6" opacity="0.5"/>`);
  out.push(`<ellipse cx="${r1(hx + R * 0.98)}" cy="${r1(hy + R * 0.28)}" rx="2.6" ry="3.6" fill="${outline}" opacity="0.55"/>`);
  if (mood === 'joy') {
    out.push(`<path d="M${P(hx + R * 0.66, hy + R * 0.52)} Q${P(hx + R * 0.78, hy + R * 0.74)} ${P(hx + R * 0.92, hy + R * 0.54)} Z" fill="#ff7aa8" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>`);
  } else {
    out.push(`<path d="M${P(hx + R * 0.68, hy + R * 0.56)} Q${P(hx + R * 0.78, hy + R * 0.66)} ${P(hx + R * 0.9, hy + R * 0.56)}" fill="none" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>`);
  }
  if (L.face === 'heartglasses' || L.face === 'starshades') {
    const hearts = L.face === 'heartglasses';
    const w = R * 0.36;
    // The arm runs back toward the ear; the bridge heads for the far lens, hidden behind the face.
    out.push(`<path d="M${P(ex - w * 0.8, ey - R * 0.1)} L${P(hx - R * 0.42, hy - R * 0.3)} M${P(ex + w * 0.85, ey - R * 0.12)} Q${P(ex + w * 1.2, ey - R * 0.22)} ${P(hx + R * 0.7, ey - R * 0.12)}" fill="none" stroke="${hearts ? '#ff3f8e' : '#ffb21f'}" stroke-width="3.5" stroke-linecap="round"/>`);
    out.push(hearts
      ? `<path d="${heart(ex, ey - R * 0.05, R * 0.34)}" fill="#ff8fc6" fill-opacity="0.35" stroke="#ff3f8e" stroke-width="3.5" stroke-linejoin="round"/>`
      : `<path d="${star(ex, ey, R * 0.42, 5, 0.56)}" fill="#2d1f4a" fill-opacity="0.9" stroke="#ffb21f" stroke-width="3.5" stroke-linejoin="round"/><path d="M${P(ex - R * 0.1, ey - R * 0.12)} l${r1(R * 0.12)} ${r1(-R * 0.08)}" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`);
  }
  return out.join('');
}

function patternSVG(kind, g, id, coat, mane) {
  if (!kind) return '';
  const { bodyCx: bx, bodyCy: by, bodyRx: brx, bodyRy: bry, headCx: hx, headCy: hy, headR: R } = g;
  const at = (u, v) => [bx + u * brx, by + v * bry];
  const dark = lum(coat) < 0.25;
  const spots = [[-0.55, -0.25, 11], [-0.18, 0.2, 8], [0.18, -0.4, 9], [-0.72, 0.32, 7], [0.42, 0.12, 9], [0.02, -0.08, 6]];
  const shapes = [];
  if (kind === 'freckles') {
    return [[0.3, 0.36], [0.4, 0.44], [0.5, 0.36], [0.42, 0.28]].map(([u, v]) =>
      `<circle cx="${r1(hx + R * u)}" cy="${r1(hy + R * v)}" r="2.2" fill="${shade(coat, dark ? 0.5 : -0.35)}"/>`).join('');
  }
  for (const [u, v, s] of spots) {
    const [x, y] = at(u, v);
    if (kind === 'spots') shapes.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${s}" fill="${shade(coat, dark ? 0.18 : -0.12)}"/>`);
    if (kind === 'stars') shapes.push(`<path d="${star(x, y, s * 1.05)}" fill="${mane[shapes.length % mane.length]}" opacity="0.9"/>`);
    if (kind === 'hearts') shapes.push(`<path d="${heart(x, y, s * 0.85)}" fill="#ff7eb6" opacity="0.85"/>`);
    if (kind === 'sparkles') shapes.push(`<path d="${sparkle(x, y, s * 1.1)}" fill="#fff3a6" stroke="#f5c542" stroke-width="1.2"/>`);
  }
  return `<g clip-path="url(#${id}-body)">${shapes.join('')}</g>`;
}

function headSVG(kind, headPt, R, outline) {
  if (!kind) return '';
  const st = `stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"`;
  const flower = ([x, y], petal, center, s) => {
    let out = '';
    for (let i = 0; i < 5; i++) {
      const a = deg(i * 72 - 90);
      out += `<circle cx="${r1(x + Math.cos(a) * s * 0.62)}" cy="${r1(y + Math.sin(a) * s * 0.62)}" r="${r1(s * 0.5)}" fill="${petal}" ${st}/>`;
    }
    return `${out}<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(s * 0.42)}" fill="${center}" ${st}/>`;
  };
  const crown = [198, 220, 246, 294, 318];
  const s = R * 0.2;
  switch (kind) {
    case 'bow': {
      const [x, y] = headPt(226, 1.02);
      return `<g transform="rotate(-25 ${r1(x)} ${r1(y)})"><path d="M${P(x, y)} C${P(x - s * 2.2, y - s * 1.6)} ${P(x - s * 2.2, y + s * 1.6)} ${P(x, y)} C${P(x + s * 2.2, y - s * 1.6)} ${P(x + s * 2.2, y + s * 1.6)} ${P(x, y)}Z" fill="#ff6fae" ${st}/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(s * 0.45)}" fill="#ff9cc9" ${st}/></g>`;
    }
    case 'starclip': {
      const [x, y] = headPt(222, 1.0);
      return `<path d="${star(x, y, s * 1.3)}" fill="#ffd34d" ${st}/>`;
    }
    case 'starfish': {
      const [x, y] = headPt(222, 1.0);
      return `<path d="${star(x, y, s * 1.45, 5, 0.42)}" fill="#ff9a6b" ${st}/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(s * 0.22)}" fill="#ffd1b8"/>`;
    }
    case 'flowers':
      return crown.map((a, i) => flower(headPt(a, 0.98), ['#ff8fc8', '#b98bff', '#7cc8ff'][i % 3], '#ffe066', s)).join('');
    case 'daisy':
      return crown.map((a) => flower(headPt(a, 0.98), '#ffffff', '#ffd23f', s)).join('');
    case 'leaves':
      return crown.map((a, i) => {
        const [x, y] = headPt(a, 0.98);
        return `<g transform="rotate(${a + 90} ${r1(x)} ${r1(y)})"><path d="M${P(x - s * 1.2, y)} Q${P(x, y - s * 1.1)} ${P(x + s * 1.2, y)} Q${P(x, y + s * 1.1)} ${P(x - s * 1.2, y)}Z" fill="${['#5cc46b', '#86d96a', '#3fae6a'][i % 3]}" ${st}/></g>`;
      }).join('');
    case 'party': {
      const b = headPt(250, 0.9);
      const a = deg(-112);
      const d = [Math.cos(a), Math.sin(a)];
      const p = [-d[1], d[0]];
      const at = (k, side) => [b[0] + d[0] * R * k + p[0] * R * side, b[1] + d[1] * R * k + p[1] * R * side];
      const dots = [[0.25, -0.18, '#ffe066'], [0.3, 0.17, '#ff7eb6'], [0.58, 0.02, '#ffe066'], [0.8, -0.04, '#ff7eb6']];
      return `<path d="M${P(...at(0, -0.38))} L${P(...at(1.15, 0))} L${P(...at(0, 0.38))} Q${P(...at(-0.14, 0))} ${P(...at(0, -0.38))}Z" fill="#7cc8ff" ${st}/>`
        + dots.map(([k, side, c]) => `<circle cx="${r1(at(k, side)[0])}" cy="${r1(at(k, side)[1])}" r="${r1(R * 0.07)}" fill="${c}"/>`).join('')
        + `<circle cx="${r1(at(1.17, 0)[0])}" cy="${r1(at(1.17, 0)[1])}" r="${r1(R * 0.14)}" fill="#ff7eb6" ${st}/>`;
    }
    case 'witch': {
      const [cx, cy] = headPt(258, 0.92);
      const L = (u, v) => P(cx + R * u, cy + R * v);
      return `<g transform="rotate(-10 ${r1(cx)} ${r1(cy)})"><ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(R * 0.98)}" ry="${r1(R * 0.22)}" fill="#5a3fa8" ${st}/>`
        + `<path d="M${L(-0.5, 0)} Q${L(-0.38, -0.7)} ${L(-0.62, -1.12)} Q${L(-0.86, -1.2)} ${L(-1.0, -1.08)} Q${L(-0.6, -1.0)} ${L(-0.4, -1.22)} Q${L(0.12, -0.72)} ${L(0.46, 0)} Q${L(0, 0.14)} ${L(-0.5, 0)}Z" fill="#6f52c9" ${st}/>`
        + `<path d="M${L(-0.47, -0.09)} Q${L(0, 0.04)} ${L(0.43, -0.09)} L${L(0.36, -0.27)} Q${L(-0.02, -0.15)} ${L(-0.43, -0.27)}Z" fill="#ff7eb6" ${st}/>`
        + `<path d="${star(cx - R * 0.02, cy - R * 0.13, R * 0.13)}" fill="#ffd34d" ${st}/></g>`;
    }
    case 'crown': {
      const angles = [234, 245, 256, 267, 278, 289, 300, 311];
      const top = angles.map((a, i) => headPt(a, i % 2 ? 1.18 : (i === 0 || i === 7 ? 1.14 : 1.56)));
      const base = [...angles].reverse().map((a) => headPt(a, 0.96));
      const d = `M${top.map((q) => P(...q)).join(' L')} L${base.map((q) => P(...q)).join(' L')} Z`;
      const band = [240, 262, 284, 304].map((a) => headPt(a, 1.06));
      return `<path d="${d}" fill="#ffcf4d" ${st}/>`
        + [2, 4, 6].map((i) => `<circle cx="${r1(top[i][0])}" cy="${r1(top[i][1])}" r="${r1(R * 0.08)}" fill="#fff3b0" ${st}/>`).join('')
        + band.map(([x, y], i) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R * 0.065)}" fill="${['#ff6fae', '#7cc8ff', '#b18cff', '#6fdc8c'][i]}"/>`).join('');
    }
    case 'tiara': {
      const pts = [244, 258, 286, 300].map((a) => headPt(a, 1.0));
      const peaks = [252, 272, 293].map((a) => headPt(a, 1.32));
      const d = `M${P(...pts[0])} L${P(...peaks[0])} L${P(...pts[1])} L${P(...peaks[1])} L${P(...pts[2])} L${P(...peaks[2])} L${P(...pts[3])} Z`;
      const [gx, gy] = headPt(272, 1.12);
      return `<path d="${d}" fill="#ffd56b" ${st}/><circle cx="${r1(gx)}" cy="${r1(gy)}" r="${r1(s * 0.35)}" fill="#ff6fae" ${st}/>`;
    }
    default:
      return '';
  }
}

function neckSVG(kind, nb1, nh1, nb2, nh2, outline) {
  if (!kind) return '';
  const back = lerp(nb1, nh1, 0.42);
  const front = lerp(nb2, nh2, 0.42);
  const ctrl = [(back[0] + front[0]) / 2 + 6, (back[1] + front[1]) / 2 + 18];
  const curve = `M${P(...back)} Q${P(...ctrl)} ${P(...front)}`;
  const at = (t) => [
    (1 - t) ** 2 * back[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * front[0],
    (1 - t) ** 2 * back[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * front[1],
  ];
  const st = `stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"`;
  const chain = `<path d="${curve}" fill="none" stroke="#e8b64a" stroke-width="3" stroke-linecap="round"/>`;
  const [cx, cy] = at(0.72);
  switch (kind) {
    case 'locket': return `${chain}<path d="${heart(cx, cy + 8, 7)}" fill="#ff6fae" ${st}/>`;
    case 'twinstars': return `${chain}<path d="${star(cx - 7, cy + 7, 7)}" fill="#ffd34d" ${st}/><path d="${star(cx + 7, cy + 8, 7)}" fill="#ffd34d" ${st}/>`;
    case 'horseshoe': return `${chain}<path d="M${P(cx - 7, cy + 2)} L${P(cx - 7, cy + 9)} A7 7 0 0 0 ${P(cx + 7, cy + 9)} L${P(cx + 7, cy + 2)}" fill="none" stroke="#e8b64a" stroke-width="5" stroke-linecap="round"/>`;
    case 'pearls': {
      let out = '';
      for (let i = 0; i <= 8; i++) {
        const [x, y] = at(i / 8);
        out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="4.2" fill="#fbf7ff" stroke="${outline}" stroke-width="1.5"/>`;
      }
      return out;
    }
    case 'bell': return `<path d="${curve}" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round"/><path d="${curve}" fill="none" stroke="#ff6f91" stroke-width="6.5" stroke-linecap="round"/><circle cx="${r1(cx)}" cy="${r1(cy + 7)}" r="7" fill="#ffd34d" ${st}/><path d="M${P(cx - 3, cy + 9)} L${P(cx + 3, cy + 9)}" stroke="${outline}" stroke-width="2" stroke-linecap="round"/>`;
    case 'scarf':
    case 'beescarf': {
      const main = kind === 'scarf' ? '#7cc8ff' : '#ffd23f';
      const stripe = kind === 'scarf' ? '#ffffff' : '#5a3a1a';
      const tail = `M${P(cx - 2, cy - 2)} L${P(cx - 10, cy + 30)} L${P(cx + 4, cy + 32)} L${P(cx + 8, cy)} Z`;
      return `<path d="${curve}" fill="none" stroke="${outline}" stroke-width="17" stroke-linecap="round"/><path d="${curve}" fill="none" stroke="${main}" stroke-width="12" stroke-linecap="round"/><path d="${curve}" fill="none" stroke="${stripe}" stroke-width="12" stroke-dasharray="5 7" opacity="0.8"/><path d="${tail}" fill="${main}" ${st}/><path d="M${P(cx - 6, cy + 14)} L${P(cx + 6, cy + 15)} M${P(cx - 8, cy + 23)} L${P(cx + 5, cy + 24)}" stroke="${stripe}" stroke-width="3.5" opacity="0.85"/>`;
    }
    case 'bowtie': {
      const [x, y] = at(0.92);
      return `<path d="M${P(x, y)} L${P(x - 13, y - 9)} L${P(x - 13, y + 9)} Z M${P(x, y)} L${P(x + 13, y - 9)} L${P(x + 13, y + 9)} Z" fill="#b18cff" ${st}/><circle cx="${r1(x)}" cy="${r1(y)}" r="4.5" fill="#d9c4ff" ${st}/>`;
    }
    default: return '';
  }
}

// A long wavy lock: a ribbon that tapers to a point and ripples side to side as it falls.
function wave(x, y, ang, len, wid, amp, waves) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const left = [];
  const right = [];
  for (let i = 0; i <= 14; i++) {
    const s = i / 14;
    const off = amp * Math.sin(s * waves * 2 * Math.PI) * Math.min(1, s * 3);
    const cx = x + dx * len * s - dy * off;
    const cy = y + dy * len * s + dx * off;
    const w = (wid / 2) * (1 - s) ** 0.7;
    left.push([cx - dy * w, cy + dx * w]);
    right.push([cx + dy * w, cy - dx * w]);
  }
  const pts = [...left, ...right.reverse().slice(1)];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${P(...mid(pts[pts.length - 1], pts[0]))}`;
  pts.forEach((p, i) => { d += ` Q${P(...p)} ${P(...mid(p, pts[(i + 1) % pts.length]))}`; });
  return `${d}Z`;
}

// A sharp, slightly curved spike for rock-star hair.
function spike(x, y, ang, len, wid) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const tip = [x + dx * len, y + dy * len];
  const a = [x - (dy * wid) / 2, y + (dx * wid) / 2];
  const b = [x + (dy * wid) / 2, y - (dx * wid) / 2];
  const c1 = [x + dx * len * 0.5 - dy * wid * 0.34, y + dy * len * 0.5 + dx * wid * 0.34];
  const c2 = [x + dx * len * 0.5 + dy * wid * 0.2, y + dy * len * 0.5 - dx * wid * 0.2];
  return `M${P(...a)} Q${P(...c1)} ${P(...tip)} Q${P(...c2)} ${P(...b)} Z`;
}

const swirl = (x, y, r, outline) => `<path d="M${P(x - r, y)} A${r1(r)} ${r1(r)} 0 1 1 ${P(x, y + r)}" fill="none" stroke="${outline}" stroke-width="2" stroke-linecap="round" opacity="0.4"/>`;
const puff = (x, y, r, fill, stroke) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${fill}" ${stroke}/>`;

// A springy ringlet: shrinking curls stacked from the root down, each with a swirl.
function ringlet(x, y, ang, len, wid, fill, stroke, outline) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const out = [];
  for (let i = 3; i >= 0; i--) {
    const s = i / 3;
    const r = (wid / 2) * (1 - 0.42 * s);
    const side = (i % 2 ? 1 : -1) * wid * 0.1;
    const cx = x + dx * len * s * 0.8 - dy * side;
    const cy = y + dy * len * s * 0.8 + dx * side;
    out.push(puff(cx, cy, r, fill, stroke) + swirl(cx, cy, r * 0.45, outline));
  }
  return out.join('');
}

// A plait: leaf shapes that lean left and right in turn along a line of points.
function plaits(pts, size, colors, stroke, outline) {
  return pts.map(({ x, y, a }, i) => {
    const side = (i % 2 ? 1 : -1) * size * 0.26;
    const cx = x - Math.sin(deg(a)) * side;
    const cy = y + Math.cos(deg(a)) * side;
    const rot = `transform="rotate(${r1(a + (i % 2 ? 34 : -34))} ${r1(cx)} ${r1(cy)})"`;
    return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(size)}" ry="${r1(size * 0.56)}" fill="${colors[i % colors.length]}" ${rot} ${stroke}/>`
      + `<path d="M${P(cx - size * 0.45, cy)} L${P(cx + size * 0.45, cy)}" ${rot} stroke="${outline}" stroke-width="1.6" stroke-linecap="round" opacity="0.35"/>`;
  }).reverse().join('');
}

// Points along a quadratic curve, with the direction it travels (in degrees).
function along(P0, P1, P2, ts) {
  return ts.map((t) => ({
    x: (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0],
    y: (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1],
    a: (Math.atan2((1 - t) * (P1[1] - P0[1]) + t * (P2[1] - P1[1]), (1 - t) * (P1[0] - P0[0]) + t * (P2[0] - P1[0])) * 180) / Math.PI,
  }));
}

// The mane: locks along a curve from behind the horn down the back of the neck.
function maneSVG(style, g, headOnly, mane, stroke, outline) {
  const { headCx: hx, headCy: hy, headR: R, bodyCx: bx, bodyCy: by, bodyRx: brx, bodyRy: bry } = g;
  const P0 = [hx - R * 0.12, hy - R * 0.98];
  const P1 = [hx - R * 1.1, hy - R * 0.72];
  const P2 = [bx + brx * 0.18, by - bry * 0.8];
  if (style === 'braids') {
    const ts = [];
    for (let t = 0; t <= (headOnly ? 0.56 : 1.001); t += 0.07) ts.push(t);
    const base = along(P0, P1, P2, ts.filter((t, i) => i % 3 === 1)).map(({ x, y }, i) =>
      `<path d="${lock(x, y, deg(150 - 30 * i), R * 0.5, R * 0.5, R * 0.16)}" fill="${mane[(i + 1) % mane.length]}" ${stroke}/>`);
    return base.join('') + plaits(along(P0, P1, P2, ts), R * 0.21, mane, stroke, outline);
  }
  const ts = headOnly ? [0.5, 0.35, 0.2, 0.05] : [0.95, 0.8, 0.65, 0.5, 0.35, 0.2, 0.05];
  return along(P0, P1, P2, ts).map(({ x, y }, k) => {
    const t = ts[k];
    const fill = mane[(ts.length - 1 - k) % mane.length];
    const ang = deg(162 - 62 * t);
    const len = R * (1.08 - 0.22 * t);
    const wid = R * (0.74 - 0.16 * t);
    const fall = (to, f) => ang + (deg(to) - ang) * f;
    switch (style) {
      case 'wavy': return `<path d="${wave(x, y, fall(105, 0.3), len * (headOnly ? 1.15 : 1.45), wid * 0.88, R * 0.11, 1.25)}" fill="${fill}" ${stroke}/>`;
      case 'curly': return ringlet(x, y, fall(100, 0.35), len * 0.95, wid * 0.95, fill, stroke, outline);
      case 'puffy': {
        const a = fall(110, 0.2);
        return puff(x + Math.cos(a) * len * 0.62, y + Math.sin(a) * len * 0.62, wid * 0.44, fill, stroke)
          + puff(x + Math.cos(a) * len * 0.28, y + Math.sin(a) * len * 0.28, wid * 0.6, fill, stroke);
      }
      case 'spikes': return `<path d="${spike(x, y, deg(222 - 60 * t), len * 0.95, wid * 0.75)}" fill="${fill}" ${stroke}/>`;
      default: return `<path d="${lock(x, y, ang, len, wid, R * 0.34)}" fill="${fill}" ${stroke}/>`;
    }
  }).join('');
}

function forelockSVG(style, g, mane, stroke, outline) {
  const { headCx: hx, headCy: hy, headR: R } = g;
  const c = (i) => mane[i % mane.length];
  switch (style) {
    case 'wavy':
      return `<path d="${wave(hx - R * 0.22, hy - R * 0.9, deg(78), R * 0.6, R * 0.34, R * 0.06, 1)}" fill="${c(1)}" ${stroke}/>`
        + `<path d="${wave(hx - R * 0.04, hy - R * 0.94, deg(42), R * 0.72, R * 0.4, R * 0.07, 1)}" fill="${c(0)}" ${stroke}/>`;
    case 'curly':
      return [[-0.16, -0.86, 0.19, 2], [0.2, -0.76, 0.16, 1], [0.03, -0.9, 0.21, 0]].map(([u, v, r, i]) =>
        puff(hx + R * u, hy + R * v, R * r, c(i), stroke) + swirl(hx + R * u, hy + R * v, R * r * 0.45, outline)).join('');
    case 'puffy':
      return puff(hx + R * 0.2, hy - R * 0.8, R * 0.2, c(1), stroke) + puff(hx - R * 0.06, hy - R * 0.9, R * 0.27, c(0), stroke);
    case 'spikes':
      return [[-0.2, -0.86, -38, 1], [-0.06, -0.92, -12, 2], [0, -0.92, 18, 0]].map(([u, v, a, i]) =>
        `<path d="${spike(hx + R * u, hy + R * v, deg(a), R * 0.6, R * 0.3)}" fill="${c(i)}" ${stroke}/>`).join('');
    default:
      return `<path d="${lock(hx - R * 0.04, hy - R * 0.94, deg(52), R * 0.62, R * 0.4, -R * 0.12)}" fill="${mane[0]}" ${stroke}/>`
        + `<path d="${lock(hx - R * 0.22, hy - R * 0.9, deg(80), R * 0.5, R * 0.34, -R * 0.1)}" fill="${mane[1 % mane.length]}" ${stroke}/>`;
  }
}

function tailSVG(style, x, y, s, mane, stroke, outline) {
  if (style === 'braids') {
    const end = [x - 26 * s, y + 70 * s];
    const pts = along([x, y + 2], [x - 34 * s, y + 24 * s], end, [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84]);
    return `<path d="${lock(end[0], end[1] - 6 * s, deg(96), 34 * s, 26 * s, 6 * s)}" fill="${mane[0]}" ${stroke}/>`
      + plaits(pts, 13 * s, mane, stroke, outline);
  }
  const locks = [[x + 2, y - 2, 160, 64, 32, 16], [x, y + 2, 128, 84, 34, 20], [x + 4, y + 6, 100, 74, 30, 20]];
  return locks.map(([lx, ly, a, len, wid, bend], i) => {
    const fill = mane[(i + 1) % mane.length];
    const at = (k) => [lx + Math.cos(deg(a)) * len * k * s, ly + Math.sin(deg(a)) * len * k * s];
    switch (style) {
      case 'wavy': return `<path d="${wave(lx, ly, deg(a + 8), len * 1.35 * s, wid * s, 7 * s, 1.3)}" fill="${fill}" ${stroke}/>`;
      case 'curly': return ringlet(lx, ly, deg(a + 5), len * 1.05 * s, wid * 1.5 * s, fill, stroke, outline);
      case 'puffy': return puff(...at(0.62), wid * 0.5 * s, fill, stroke) + puff(...at(0.26), wid * 0.62 * s, fill, stroke);
      case 'spikes': return `<path d="${spike(lx, ly, deg(a + 12), len * 1.02 * s, wid * 0.82 * s)}" fill="${fill}" ${stroke}/>`;
      default: return `<path d="${lock(lx, ly, deg(a), len * s, wid * s, bend * s)}" fill="${fill}" ${stroke}/>`;
    }
  }).join('');
}

// A bow (or a bow with rainbow streamers) tied where the tail meets the body.
export function tailBowSVG(kind, x, y, s, outline) {
  if (!kind) return '';
  const st = `stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"`;
  const [main, light] = kind === 'ribbons' ? ['#ff8fc8', '#ffd0e8'] : kind;
  const b = 10.5 * s;
  const cx = x + 1;
  const cy = y + 2;
  let out = '';
  if (kind === 'ribbons') {
    RAINBOW.slice(0, 6).forEach((c, i) => {
      const a = deg(104 + i * 9);
      const len = (62 - i * 3) * s;
      const d = `M${P(cx, cy)} Q${P(cx + Math.cos(a) * len * 0.5 + 9 * s, cy + Math.sin(a) * len * 0.5)} ${P(cx + Math.cos(a) * len, cy + Math.sin(a) * len)}`;
      out += `<path d="${d}" fill="none" stroke="${outline}" stroke-width="${r1(6 * s)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${r1(3.6 * s)}" stroke-linecap="round"/>`;
    });
  } else {
    out += `<path d="M${P(cx, cy)} L${P(cx - 9 * s, cy + 22 * s)} L${P(cx - 2 * s, cy + 19 * s)} Z M${P(cx, cy)} L${P(cx + 6 * s, cy + 22 * s)} L${P(cx + 13 * s, cy + 16 * s)} Z" fill="${main}" ${st}/>`;
  }
  return `${out}<g transform="rotate(-40 ${r1(cx)} ${r1(cy)})"><path d="M${P(cx, cy)} C${P(cx - b * 2.2, cy - b * 1.6)} ${P(cx - b * 2.2, cy + b * 1.6)} ${P(cx, cy)} C${P(cx + b * 2.2, cy - b * 1.6)} ${P(cx + b * 2.2, cy + b * 1.6)} ${P(cx, cy)}Z" fill="${main}" ${st}/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(b * 0.45)}" fill="${light}" ${st}/></g>`;
}

// A row of downward bumps from a to b, continuing a path that is already at a.
function scallops(a, b, n, depth) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = lerp(a, b, (i + 1) / n);
    const m = lerp(a, b, (i + 0.5) / n);
    d += ` Q${P(m[0], m[1] + depth)} ${P(...p)}`;
  }
  return d;
}

function outfitSVG(kind, g, nb1, nb2, nh2, outline) {
  if (!kind) return '';
  const { bodyCx: bx, bodyCy: by, bodyRx: brx, bodyRy: bry } = g;
  const st = `stroke="${outline}" stroke-width="3" stroke-linejoin="round"`;
  if (kind === 'tutu') {
    const layer = (y1, xl, xr, n, fill) => {
      const wl = [bx - brx * 0.6, by + bry * 0.05];
      const wr = [bx + brx * 0.58, by + bry * 0.05];
      const hl = [bx - brx * xl, by + bry * y1];
      const hr = [bx + brx * xr, by + bry * y1];
      return `<path d="M${P(...wl)} Q${P(bx, by + bry * 0.21)} ${P(...wr)} L${P(...hr)}${scallops(hr, hl, n, bry * 0.16)} Z" fill="${fill}" ${st}/>`;
    };
    const band = `M${P(bx - brx * 0.62, by)} Q${P(bx, by + bry * 0.18)} ${P(bx + brx * 0.6, by)}`;
    return layer(1.0, 0.9, 0.86, 7, '#ffd6ec') + layer(0.78, 0.8, 0.76, 6, '#ff9ccd')
      + `<path d="${band}" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round"/><path d="${band}" fill="none" stroke="#ff6fae" stroke-width="6" stroke-linecap="round"/>`
      + `<path d="${heart(bx + brx * 0.06, by + bry * 0.08, 6)}" fill="#ffe066" ${st}/>`;
  }
  if (kind === 'cape') {
    const clasp = lerp(nb2, nh2, 0.16);
    const wither = [nb1[0] - 2, nb1[1] - 3];
    const rump = [bx - brx * 0.84, by - bry * 0.6];
    const corner = [bx - brx * 1.02, by + bry * 0.5];
    const front = [bx + brx * 0.5, by + bry * 0.28];
    const hem = scallops(corner, front, 4, bry * 0.22);
    return `<path d="M${P(...clasp)} Q${P((clasp[0] + wither[0]) / 2, wither[1] - 8)} ${P(...wither)} Q${P(bx - brx * 0.3, by - bry * 1.2)} ${P(...rump)} Q${P(bx - brx * 1.06, by - bry * 0.2)} ${P(...corner)}${hem} Q${P(bx + brx * 0.8, by - bry * 0.05)} ${P(...clasp)} Z" fill="#8b4fd6" ${st}/>`
      + `<path d="M${P(...corner)}${hem}" fill="none" stroke="#ffcf4d" stroke-width="4" stroke-linecap="round"/>`
      + `<path d="M${P(bx - brx * 0.45, by - bry * 0.75)} Q${P(bx - brx * 0.5, by)} ${P(bx - brx * 0.62, by + bry * 0.55)} M${P(bx + brx * 0.05, by - bry * 0.8)} Q${P(bx + brx * 0.02, by - bry * 0.1)} ${P(bx - brx * 0.08, by + bry * 0.45)}" fill="none" stroke="#6a35b0" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`
      + `<path d="${star(clasp[0], clasp[1] + 2, 8)}" fill="#ffcf4d" ${st}/>`;
  }
  return '';
}
