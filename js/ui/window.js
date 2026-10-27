// The Magic Window: the 10 × 10 times table as stained glass. A pane lights up when she
// knows that fact by heart, and stays lit; 3 × 4 and 4 × 3 light up together.
import { h, art, icon, esc } from './dom.js';
import { litPanes } from './progress.js';
import { mulId } from '../engine/facts.js';

const N = 10;
const CELL = 48;
const PAD = 44;

function paneColor(r, c, pale = false) {
  const hue = ((r + c - 2) / 18) * 320;
  return pale ? `hsl(${hue.toFixed(0)} 70% 89%)` : `hsl(${hue.toFixed(0)} 86% 68%)`;
}

function windowSVG(m, title) {
  const left = 26;
  const top = 120;
  const w = left * 2 + PAD + N * CELL;
  const gridW = PAD + N * CELL;
  const archR = gridW / 2 + 8;
  const ht = top + gridW + 30;
  const cx = left + gridW / 2;
  let panes = '';
  for (let r = 1; r <= N; r++) {
    for (let c = 1; c <= N; c++) {
      const s = m.items.get(mulId(r, c));
      const state = s?.everMastered ? 'lit' : s?.introduced ? 'learning' : 'dim';
      const x = left + PAD + (c - 1) * CELL;
      const y = top + PAD + (r - 1) * CELL;
      const fill = state === 'dim' ? '#f4effc' : paneColor(r, c, state === 'learning');
      panes += `<g class="pane ${state}${r === c ? ' square' : ''}" data-r="${r}" data-c="${c}">
        <rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="6" fill="${fill}"/>
        ${state === 'lit' ? `<path d="M${x + 9} ${y + 22} q2 -11 13 -13" class="shine"/>` : ''}</g>`;
    }
  }
  let heads = '';
  for (let k = 1; k <= N; k++) {
    heads += `<circle cx="${left + PAD + (k - 0.5) * CELL}" cy="${top + PAD / 2}" r="15" class="head-dot"/><text x="${left + PAD + (k - 0.5) * CELL}" y="${top + PAD / 2 + 6}" class="head-num">${k}</text>`;
    heads += `<circle cx="${left + PAD / 2}" cy="${top + PAD + (k - 0.5) * CELL}" r="15" class="head-dot"/><text x="${left + PAD / 2}" y="${top + PAD + (k - 0.5) * CELL + 6}" class="head-num">${k}</text>`;
  }
  return `<svg class="window-svg" viewBox="0 0 ${w} ${ht}" role="img" aria-label="Magic Window times table">
    <path d="M${left - 12} ${ht - 8} V${top + 10} A${archR + 12} ${archR * 0.62} 0 0 1 ${left + gridW + 12} ${top + 10} V${ht - 8} Z" class="frame"/>
    <path d="M${left} ${top + 14} A${archR} ${archR * 0.56} 0 0 1 ${left + gridW} ${top + 14} Z" class="arch-glass"/>
    <text x="${cx}" y="${top - 22}" class="window-title">${esc(title)}</text>
    <text x="${left + PAD / 2}" y="${top + PAD / 2 + 7}" class="head-num times">×</text>
    ${heads}${panes}
  </svg>`;
}

export function windowScreen(app) {
  const m = app.model;
  const lit = litPanes(m);
  const title = m.name ? `${m.name}'s Magic Window` : 'Magic Window';
  const info = h('p', { class: 'pane-info' }, 'Tap a pane to see its spell.');
  const pic = art(windowSVG(m, title), 'window-wrap');
  pic.addEventListener('click', (e) => {
    const g = e.target.closest('.pane');
    if (!g) return;
    const r = Number(g.dataset.r);
    const c = Number(g.dataset.c);
    const s = m.items.get(mulId(r, c));
    const isl = app.catalog.islands[app.catalog.items.get(mulId(r, c)).island];
    const where = s?.everMastered ? 'You know this one by heart!' : s?.introduced ? 'You are learning this one.' : `You'll learn this one on ${isl.name}.`;
    info.textContent = `${r} × ${c} = ${r * c}. ${where}`;
    pic.querySelectorAll('.pane.picked').forEach((p) => p.classList.remove('picked'));
    g.classList.add('picked');
  });
  const el = h('div', { class: 'screen window' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back home', onClick: () => app.go('home') }, icon('back')),
      h('h1', { class: 'screen-title' }, 'Magic Window'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Print my window', onClick: () => print() }, icon('print'))),
    h('main', { class: 'window-main' }, pic,
      h('div', { class: 'window-side' },
        h('p', { class: 'big-line' }, `${lit} of 100 panes are glowing`),
        h('p', { class: 'line' }, 'Each pane lights up when you know that spell by heart. Look: the window is the same on both sides of the gold diagonal, because 3 × 4 and 4 × 3 are the same spell!'),
        info)));
  return { el };
}
