// Dressing up her unicorn. In "hatch" mode it shows only the free starter styles; in the
// Boutique, locked styles can be bought with stardust or earned from island friends.
import { h, art, icon, modal, toast } from './dom.js';
import { dustPill } from './home.js';
import { unicornSVG, tailBowSVG } from '../art/unicorn.js';
import { sceneSVG, petSceneSVG } from '../art/scenes.js';
import { SLOTS, DEFAULT_LOOK, ownedSet } from '../art/catalog.js';
import { RAINBOW } from '../art/color.js';
import { sfx } from '../audio/sfx.js';
import { growth, stardust } from '../engine/model.js';

function swatchFace(it, look, age) {
  const v = it.value;
  switch (it.slot) {
    case 'coat':
      return art(`<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="${v}" stroke="#6b5a8e" stroke-width="2.5"/></svg>`, 'swatch-art');
    case 'mane': {
      const w = 32 / v.length;
      return art(`<svg viewBox="0 0 40 40"><clipPath id="c-${it.id.replace(':', '-')}"><circle cx="20" cy="20" r="16"/></clipPath><g clip-path="url(#c-${it.id.replace(':', '-')})">${v.map((c, i) => `<rect x="${4 + i * w}" y="0" width="${w + 0.5}" height="40" fill="${c}"/>`).join('')}</g><circle cx="20" cy="20" r="16" fill="none" stroke="#6b5a8e" stroke-width="2.5"/></svg>`, 'swatch-art');
    }
    case 'horn': {
      const fill = v === 'rainbow' ? 'url(#hr)' : v;
      return art(`<svg viewBox="0 0 40 40"><defs><linearGradient id="hr" x1="0" y1="1" x2="0" y2="0">${RAINBOW.map((c, i) => `<stop offset="${i / 6}" stop-color="${c}"/>`).join('')}</linearGradient></defs><path d="M13 34 L20 4 L27 34 Q20 38 13 34Z" fill="${fill}" stroke="#6b5a8e" stroke-width="2.5" stroke-linejoin="round"/></svg>`, 'swatch-art');
    }
    case 'eye':
      return art(`<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="11" ry="15" fill="${v}" stroke="#2a1f3d" stroke-width="2.5"/><circle cx="24" cy="13" r="4.5" fill="#fff"/></svg>`, 'swatch-art');
    case 'scene':
      if (v) return art(sceneSVG(v), 'swatch-art');
      break;
    case 'tail':
      if (v) return art(`<svg viewBox="0 0 40 40">${tailBowSVG(v, 20, 13, 0.85, '#6b5a8e')}</svg>`, 'swatch-art');
      break;
    case 'hoof':
      if (v) {
        const fill = v === 'glitter' ? 'url(#hg)' : v;
        return art(`<svg viewBox="0 0 40 40"><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb3e0"/><stop offset="0.5" stop-color="#d4b8ff"/><stop offset="1" stop-color="#9fdcff"/></linearGradient></defs><path d="M11 10 H29 V28 Q29 33 24 33 H16 Q11 33 11 28 Z" fill="${fill}" stroke="#6b5a8e" stroke-width="2.5" stroke-linejoin="round"/><path d="M11 22 H29" stroke="#6b5a8e" stroke-width="2" opacity="0.4"/></svg>`, 'swatch-art');
      }
      break;
  }
  // Everything else is shown on her unicorn itself; face and hair items on a close-up.
  const trial = { ...look, [it.slot]: it.id };
  return art(unicornSVG(trial, { age, crop: ['head', 'hair', 'face'].includes(it.slot) ? 'head' : 'full' }), 'swatch-art pet-mini');
}

export function designer(app, { mode = 'boutique', onDone }) {
  const cat = app.catalog;
  let look = { ...DEFAULT_LOOK, ...(app.model.look || {}) };
  // While hatching, only the tabs with a real choice among the free starter styles.
  const slots = mode === 'hatch'
    ? SLOTS.filter((s) => s.items.filter((it) => it.cost === 0 && !it.reward && !it.hidden).length > 1)
    : SLOTS;
  let tab = slots[0].key;
  const age = mode === 'hatch' ? 0.15 : growth(app.model).age;
  const wings = mode !== 'hatch' && growth(app.model).wings;
  const preview = h('div', { class: 'designer-preview' });
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const grid = h('div', { class: 'swatches' });
  const pillSlot = h('div', {});

  function draw() {
    preview.innerHTML = petSceneSVG(look, { age, wings });
    if (mode !== 'hatch') pillSlot.replaceChildren(dustPill(app.model));
    tabs.replaceChildren(...slots.map((s) => h('button', {
      class: `tab ${s.key === tab ? 'on' : ''}`, role: 'tab', type: 'button', 'aria-selected': String(s.key === tab),
      onClick: () => { tab = s.key; draw(); },
    }, s.label)));
    const owned = ownedSet(app.model);
    const slot = SLOTS.find((s) => s.key === tab);
    const list = slot.items.filter((it) => !it.hidden && (mode !== 'hatch' || (owned.has(it.id) && !it.reward)));
    grid.replaceChildren(...list.map((it) => {
      const has = owned.has(it.id);
      const on = look[tab] === it.id;
      const badge = has ? null : it.reward
        ? h('span', { class: 'price' }, icon('lock', 'icon tiny'), 'Friend gift')
        : h('span', { class: 'price' }, icon('star', 'icon tiny dust-icon'), String(it.cost));
      return h('button', { class: `swatch ${on ? 'on' : ''} ${has ? '' : 'locked'}`, type: 'button', 'aria-pressed': String(on), onClick: () => choose(it, has) },
        swatchFace(it, look, age), h('span', { class: 'swatch-name' }, it.name), badge);
    }));
  }

  function choose(it, has) {
    if (has) {
      look = { ...look, [it.slot]: it.id };
      sfx.pop();
      draw();
      return;
    }
    if (it.reward) {
      const isl = cat.islands.find((i) => i.id === it.reward);
      toast(`Befriend ${isl.friend} on ${isl.name} to get this gift!`);
      return;
    }
    const have = stardust(app.model);
    if (have < it.cost) {
      toast(`You need ${it.cost - have} more stardust. Earn it on quests!`);
      return;
    }
    modal({
      title: `Get ${it.name}?`,
      body: h('p', {}, `It costs ${it.cost} stardust. You have ${have}.`),
      actions: [['Not now', null, 'btn soft'], ['Yes, please!', () => {
        app.log('buy', { item: it.id, cost: it.cost });
        sfx.coin();
        look = { ...look, [it.slot]: it.id };
        draw();
      }, 'btn primary']],
    });
  }

  function save() {
    if (mode !== 'hatch' && JSON.stringify(look) !== JSON.stringify(app.model.look)) app.log('look', { look });
    onDone?.(look);
  }

  draw();
  const el = h('div', { class: `designer ${mode}` },
    h('div', { class: 'designer-left' }, preview, mode !== 'hatch' ? pillSlot : null),
    h('div', { class: 'designer-right' }, tabs, grid,
      h('button', { class: 'btn primary big', type: 'button', onClick: save }, mode === 'hatch' ? 'Next' : 'Done')));
  return { el };
}

export function boutiqueScreen(app) {
  const d = designer(app, { mode: 'boutique', onDone: () => app.go('home') });
  const el = h('div', { class: 'screen boutique' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back home', onClick: () => app.go('home') }, icon('back')),
      h('h1', { class: 'screen-title' }, 'Boutique'), h('div', {})),
    h('main', { class: 'boutique-main' }, d.el));
  return { el };
}
