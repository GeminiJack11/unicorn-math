// Spell Book: she makes a memory charm (a drawing, a rhyme, or both) for any spell, and it
// pops up to help whenever that spell is tricky. Charms stay on this device and in backups.
import { h, art, icon, modal, toast } from './dom.js';
import { charmSVG, strokePath, strokeAttrs } from '../art/charm.js';
import { sfx } from '../audio/sfx.js';
import { cleanCharm, PAGE, INK, ERASER, PENS, TEXT_MAX } from '../engine/charms.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const factLine = (fam) => `${fam.teach} × ${fam.other} = ${fam.answer}`;
const hasDrawing = (charm) => charm.strokes.some((s) => s.c !== ERASER);

// Her charm, as shown inside a hint or lesson.
export function charmBox(charm) {
  return h('div', { class: 'charm-box' },
    h('div', { class: 'charm-label' }, icon('star', 'icon tiny dust-icon'), 'Your charm'),
    hasDrawing(charm) ? art(charmSVG(charm), 'charm-pic') : null,
    charm.text ? h('p', { class: 'charm-text' }, charm.text) : null);
}

// Families she has met, and the ones worth a charm: missed at least once and not yet
// known by heart (as × or ÷). The ×0, ×1 and ×10 rules have their own magic rules instead.
function spellLists(m) {
  const fams = [...m.catalog.items.values()].filter((it) => it.kind === 'mul' && !it.rule && m.items.get(it.id)?.introduced);
  const misses = new Map();
  for (const [id, s] of m.items) {
    const it = m.catalog.items.get(id);
    if (it && s.wrong > 0) misses.set(it.family, (misses.get(it.family) || 0) + s.wrong);
  }
  const practice = fams.filter((f) => misses.has(f.id) && !m.items.get(f.id).everMastered && !m.charms.has(f.id))
    .sort((a, b) => misses.get(b.id) - misses.get(a.id)).slice(0, 12);
  const charmed = fams.filter((f) => m.charms.has(f.id));
  return { fams, practice, charmed };
}

export function spellbookScreen(app, { family = null } = {}) {
  const m = app.model;
  const main = h('main', { class: 'spellbook-main' });
  const el = h('div', { class: 'screen spellbook' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onClick: () => (editing ? showList() : app.go('home')) }, icon('back')),
      h('h1', { class: 'screen-title' }, 'Spell Book'), h('div', {})),
    main);
  let editing = false;

  const tile = (fam) => {
    const charm = m.charms.get(fam.id);
    return h('button', { class: `spell-tile ${charm ? 'has-charm' : ''}`, type: 'button', 'data-family': fam.id, onClick: () => showEditor(fam) },
      h('span', { class: 'spell-fact' }, factLine(fam)),
      charm ? (hasDrawing(charm) ? art(charmSVG(charm), 'charm-thumb') : h('span', { class: 'charm-thumb-text' }, charm.text))
        : h('span', { class: 'make' }, icon('wand', 'icon tiny'), 'Make a charm'));
  };

  function showList() {
    editing = false;
    const { fams, practice, charmed } = spellLists(app.model);
    const others = fams.filter((f) => !practice.includes(f) && !charmed.includes(f));
    main.replaceChildren(...[
      h('p', { class: 'big-line intro' }, 'Make a memory charm for a spell: draw a picture, write a rhyme, or both. It will pop up to help you whenever that spell is tricky!'),
      practice.length ? h('section', { class: 'spell-section' }, h('h2', {}, 'Spells to practice'), h('div', { class: 'spell-grid' }, practice.map(tile))) : null,
      charmed.length ? h('section', { class: 'spell-section' }, h('h2', {}, 'Your charms'), h('div', { class: 'spell-grid' }, charmed.map(tile))) : null,
      others.length ? h('section', { class: 'spell-section' }, h('h2', {}, practice.length || charmed.length ? 'More spells' : 'Your spells'), h('div', { class: 'spell-grid small' }, others.map(tile))) : null,
      fams.length ? null : h('p', { class: 'line' }, 'Your spells will appear here as you learn them on your quests.'),
    ].filter(Boolean));
  }

  function showEditor(fam) {
    editing = true;
    const saved = app.model.charms.get(fam.id);
    const strokes = saved ? saved.strokes.map((s) => ({ ...s, pts: [...s.pts] })) : [];
    let ink = 0;
    let pen = 1;
    let cur = null;
    let curPath = null;
    const surface = document.createElementNS(SVGNS, 'svg');
    surface.setAttribute('viewBox', `0 0 ${PAGE.w} ${PAGE.h}`);
    surface.setAttribute('class', 'pad');
    surface.setAttribute('role', 'img');
    surface.setAttribute('aria-label', 'drawing space');

    const redraw = () => {
      surface.innerHTML = `<rect width="${PAGE.w}" height="${PAGE.h}" fill="#ffffff"/>${strokes.map((s) => `<path d="${strokePath(s.pts)}" ${strokeAttrs(s)}/>`).join('')}`;
    };
    const point = (e) => {
      const r = surface.getBoundingClientRect();
      return [Math.round(((e.clientX - r.left) / r.width) * PAGE.w), Math.round(((e.clientY - r.top) / r.height) * PAGE.h)];
    };
    surface.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      surface.setPointerCapture(e.pointerId);
      cur = { c: ink, w: pen, pts: point(e) };
      strokes.push(cur);
      curPath = document.createElementNS(SVGNS, 'path');
      curPath.setAttribute('stroke', INK[cur.c]);
      curPath.setAttribute('stroke-width', String(PENS[cur.w]));
      for (const [k, v] of [['fill', 'none'], ['stroke-linecap', 'round'], ['stroke-linejoin', 'round']]) curPath.setAttribute(k, v);
      curPath.setAttribute('d', strokePath(cur.pts));
      surface.append(curPath);
    });
    surface.addEventListener('pointermove', (e) => {
      if (!cur || cur.pts.length >= 600) return;
      const [x, y] = point(e);
      const lx = cur.pts[cur.pts.length - 2];
      const ly = cur.pts[cur.pts.length - 1];
      if (Math.hypot(x - lx, y - ly) < 5) return;
      cur.pts.push(x, y);
      curPath.setAttribute('d', strokePath(cur.pts));
    });
    const stop = () => { cur = null; curPath = null; };
    surface.addEventListener('pointerup', stop);
    surface.addEventListener('pointercancel', stop);
    redraw();

    const swatches = h('div', { class: 'ink-row' });
    const pens = h('div', { class: 'pen-row' });
    const drawTools = () => {
      swatches.replaceChildren(...INK.map((c, i) => h('button', {
        class: `ink ${i === ink ? 'on' : ''} ${i === ERASER ? 'eraser' : ''}`, type: 'button', 'aria-label': i === ERASER ? 'eraser' : `color ${i + 1}`,
        'aria-pressed': String(i === ink), style: i === ERASER ? null : { background: c },
        onClick: () => { ink = i; sfx.tap(); drawTools(); },
      }, i === ERASER ? 'Eraser' : '')));
      pens.replaceChildren(...PENS.map((w, i) => h('button', {
        class: `pen ${i === pen ? 'on' : ''}`, type: 'button', 'aria-label': ['thin pen', 'medium pen', 'thick pen'][i], 'aria-pressed': String(i === pen),
        onClick: () => { pen = i; sfx.tap(); drawTools(); },
      }, h('span', { class: 'dot', style: { width: `${6 + i * 7}px`, height: `${6 + i * 7}px` } }))),
      h('button', { class: 'btn soft', type: 'button', onClick: () => { strokes.pop(); redraw(); } }, 'Undo'),
      h('button', { class: 'btn soft', type: 'button', onClick: () => { strokes.length = 0; redraw(); } }, 'Clear'));
    };
    drawTools();

    const words = h('input', { class: 'charm-words', type: 'text', maxlength: String(TEXT_MAX), placeholder: 'A rhyme or a clue (you can skip this)', autocomplete: 'off', 'aria-label': 'Words for your charm' });
    words.value = saved?.text || '';

    const save = () => {
      const charm = cleanCharm({ strokes, text: words.value });
      if (!charm) {
        toast('Draw a picture or write some words first!');
        return;
      }
      app.log('charm', { family: fam.id, strokes: charm.strokes, text: charm.text });
      sfx.sparkle();
      toast(`Charm saved! It will help you with ${fam.teach} × ${fam.other}.`);
      showList();
    };
    const remove = () => modal({
      title: 'Remove this charm?',
      body: h('p', {}, `Your charm for ${fam.teach} × ${fam.other} will be gone.`),
      actions: [['Keep it', null, 'btn soft'], ['Remove', () => { app.log('charm', { family: fam.id, strokes: [], text: '' }); showList(); }, 'btn danger']],
    });

    main.replaceChildren(h('div', { class: 'card charm-editor pop-in' },
      h('div', { class: 'tag' }, 'Memory charm'),
      h('h2', { class: 'fact-title' }, factLine(fam)),
      fam.teach !== fam.other ? h('p', { class: 'line' }, `It works for ${fam.other} × ${fam.teach}, ${fam.answer} ÷ ${fam.teach} and ${fam.answer} ÷ ${fam.other} too.`) : null,
      h('div', { class: 'pad-area' }, surface, h('div', { class: 'tools' }, swatches, pens)),
      words,
      h('div', { class: 'row-actions' },
        saved ? h('button', { class: 'btn soft', type: 'button', onClick: remove }, 'Remove charm') : null,
        h('button', { class: 'btn soft big', type: 'button', onClick: showList }, 'Cancel'),
        h('button', { class: 'btn primary big', type: 'button', onClick: save }, 'Save charm'))));
  }

  const start = family && app.catalog.items.get(family);
  if (start?.kind === 'mul') showEditor(start);
  else showList();
  return { el };
}
