// The Rainbow Isles: islands open one after another, and each island's animal shows up in
// color once she has befriended it (learned all of that island's spells by heart).
import { h, art, icon, modal } from './dom.js';
import { dustPill } from './home.js';
import { friendSVG } from '../art/friends.js';
import { unicornSVG } from '../art/unicorn.js';
import { isUnlocked, befriended, currentIsland } from '../engine/model.js';
import { mulberry32 } from '../engine/sim.js';

const LAND = ['#a8e6a0', '#c4ee96', '#ffe6a8', '#ddd0ff', '#b6eaa6', '#86d8a0', '#ffe48f', '#9ae8e1', '#f6f2ff'];
const WIDE = { w: 1000, h: 620, r: 66, pos: [[120, 500], [290, 420], [205, 262], [380, 150], [548, 258], [628, 448], [792, 492], [878, 318], [790, 142]] };
const TALL = { w: 600, h: 1140, r: 62, pos: [[160, 1030], [430, 920], [170, 805], [425, 690], [165, 575], [425, 462], [170, 350], [425, 238], [250, 112]] };

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const pt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

function blob(cx, cy, r, seed) {
  const rnd = mulberry32(seed);
  const n = 9;
  const pts = [...Array(n)].map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r * (0.88 + rnd() * 0.2);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k * 0.74];
  });
  let d = `M${pt(mid(pts[0], pts[1]))}`;
  for (let i = 1; i <= n; i++) d += ` Q${pt(pts[i % n])} ${pt(mid(pts[i % n], pts[(i + 1) % n]))}`;
  return `${d}Z`;
}

function trail(pos) {
  let d = `M${pt(pos[0])}`;
  for (let i = 1; i < pos.length - 1; i++) d += ` Q${pt(pos[i])} ${pt(mid(pos[i], pos[i + 1]))}`;
  return `${d} L${pt(pos.at(-1))}`;
}

const nest = (markup, x, y, s) => markup.replace('<svg ', `<svg x="${x}" y="${y}" width="${s}" height="${s}" `);

function islandStatus(m, i) {
  if (!isUnlocked(m, i)) return 'locked';
  if (befriended(m, i)) return 'friend';
  if (m.cleared.has(i)) return 'cleared';
  return 'current';
}

export function mapScreen(app) {
  const m = app.model;
  const cat = app.catalog;
  const L = innerHeight > innerWidth * 1.05 ? TALL : WIDE;
  const cur = currentIsland(m);

  const isles = cat.islands.map((isl, i) => {
    const [x, y] = L.pos[i];
    const r = L.r;
    const state = islandStatus(m, i);
    const fs = r * 1.15;
    const portrait = nest(friendSVG(isl.id), x - fs / 2, y - fs * 0.72, fs);
    const label = `<g class="isle-label"><rect x="${x - 78}" y="${y + r * 0.62}" width="156" height="34" rx="17"/><text x="${x}" y="${y + r * 0.62 + 23}" text-anchor="middle">${isl.name}</text></g>`;
    const chip = `<g class="isle-chip"><rect x="${x + r * 0.45}" y="${y - r * 0.95}" width="62" height="28" rx="14"/><text x="${x + r * 0.45 + 31}" y="${y - r * 0.95 + 20}" text-anchor="middle">${isl.table.split(' ')[0]}</text></g>`;
    const extra = state === 'locked'
      ? `<g class="cloud"><path d="M${x - 58} ${y + 6} q0 -30 30 -26 q10 -26 40 -16 q30 -4 30 26 q20 6 10 26 h-100 q-16 0 -10 -10z"/></g>`
      : state === 'friend' ? `<path class="isle-star" d="M${x + r * 0.8} ${y - r * 0.2} l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z"/>` : '';
    const ring = i === cur && state !== 'friend' ? `<ellipse class="pulse" cx="${x}" cy="${y}" rx="${r * 1.12}" ry="${r * 0.86}"/>` : '';
    const friend = state === 'locked' ? '' : state === 'friend' ? portrait : `<g filter="url(#sil)">${portrait}</g>`;
    return `<g class="isle ${state}" data-i="${i}" tabindex="0" role="button" aria-label="${isl.name}">
      ${ring}<path d="${blob(x, y + 8, r, i + 3)}" class="isle-shadow"/>
      <path d="${blob(x, y, r * 1.04, i + 3)}" fill="#fff0c4" stroke="#e8cf8f" stroke-width="3"/>
      <path d="${blob(x, y - 2, r * 0.88, i + 11)}" fill="${LAND[i]}"/>
      ${friend}${extra}${label}${state === 'locked' ? '' : chip}</g>`;
  }).join('');

  const [ux, uy] = L.pos[cur];
  const marker = nest(unicornSVG(m.look, { crop: 'head' }), ux - L.r * 1.55, uy - L.r * 1.25, L.r * 0.9);
  const svg = `<svg class="map-svg" viewBox="0 0 ${L.w} ${L.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of the Rainbow Isles">
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#9fd3ff"/></linearGradient>
      <filter id="sil"><feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.62  0 0 0 0.42 0"/></filter>
    </defs>
    <rect width="${L.w}" height="${L.h}" fill="url(#sea)"/>
    ${[...Array(14)].map((_, k) => { const rnd = mulberry32(k + 40); const x = rnd() * L.w; const y = rnd() * L.h; return `<path d="M${x} ${y} q8 -6 16 0 t16 0" class="wave"/>`; }).join('')}
    <path d="${trail(L.pos)}" class="trail"/>
    ${isles}${marker}
  </svg>`;

  const mapArt = art(svg, 'map-wrap');
  mapArt.addEventListener('click', (e) => {
    const g = e.target.closest('.isle');
    if (g) openIsland(Number(g.dataset.i));
  });
  mapArt.addEventListener('keydown', (e) => {
    const g = e.target.closest?.('.isle');
    if (g && (e.key === 'Enter' || e.key === ' ')) openIsland(Number(g.dataset.i));
  });

  function openIsland(i) {
    const isl = cat.islands[i];
    const state = islandStatus(m, i);
    const known = isl.families.filter((id) => m.items.get(id)?.everMastered).length;
    const lines = {
      locked: `Finish ${cat.islands[i - 1]?.name} first to open this island.`,
      current: "You're exploring here now!",
      cleared: `${isl.friend[0].toUpperCase()}${isl.friend.slice(1)} is getting to know you. Keep practicing these spells to become friends!`,
      friend: `${isl.friend[0].toUpperCase()}${isl.friend.slice(1)} is your friend!`,
    };
    const actions = [['Close', null, 'btn soft']];
    if (state !== 'locked') {
      actions.push([i === cur ? "Start today's quest" : 'Practice here', () => app.go('session', i === cur ? {} : { focus: i }), 'btn primary']);
    }
    modal({
      title: `${isl.name} ${isl.table}`,
      cls: 'island-modal',
      body: h('div', { class: 'island-info' },
        art(friendSVG(isl.id), `friend-art ${state === 'friend' ? '' : 'shadowed'}`),
        h('p', { class: 'big-line' }, isl.why),
        h('p', {}, lines[state]),
        state === 'locked' ? null : h('div', { class: 'meter' }, h('div', { class: 'meter-fill', style: { width: `${(100 * known) / isl.families.length}%` } }),
          h('span', {}, `${known} of ${isl.families.length} spells known by heart`))),
      actions,
    });
  }

  const el = h('div', { class: 'screen map' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back home', onClick: () => app.go('home') }, icon('back')),
      h('h1', { class: 'screen-title' }, 'The Rainbow Isles'), dustPill(m)),
    h('main', { class: 'map-main' }, mapArt));
  return { el };
}
