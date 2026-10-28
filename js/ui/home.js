// Home: her unicorn, today's quest, and the ways to the map, window and boutique.
import { h, art, icon } from './dom.js';
import { petSceneSVG } from '../art/scenes.js';
import { sfx } from '../audio/sfx.js';
import { growth, stardust, practicedToday, currentIsland } from '../engine/model.js';

export function dustPill(m) {
  return h('div', { class: 'dust-pill', 'aria-label': `${stardust(m)} stardust` }, icon('star', 'icon dust-icon'), h('span', {}, String(stardust(m))));
}

export function soundButton(app) {
  const btn = h('button', { class: 'icon-btn', type: 'button' });
  const draw = () => {
    const off = app.model.settings.sound === 'off';
    btn.replaceChildren(icon(off ? 'mute' : 'sound'));
    btn.setAttribute('aria-label', off ? 'Turn sound on' : 'Turn sound off');
  };
  btn.addEventListener('click', () => {
    app.setSetting('sound', app.model.settings.sound === 'off' ? 'on' : 'off');
    sfx.pop();
    draw();
  });
  draw();
  return btn;
}

export function homeScreen(app) {
  const m = app.model;
  const g = growth(m);
  const done = practicedToday(m);
  const isl = app.catalog.islands[currentIsland(m)];
  const tile = (label, name, go) => h('button', { class: 'tile', type: 'button', onClick: () => app.go(go) }, icon(name, 'icon tile-icon'), h('span', {}, label));

  const el = h('div', { class: 'screen home' },
    h('header', { class: 'topbar' }, h('h1', { class: 'game-title' }, m.settings.title || 'Rainbow Isles'),
      h('div', { class: 'top-right' }, dustPill(m), soundButton(app))),
    h('main', { class: 'home-main' },
      h('div', { class: 'hero' }, art(petSceneSVG(m.look, { age: g.age, wings: g.wings }), 'hero-pet idle'),
        h('div', { class: 'name-tag' }, m.name || 'Your unicorn')),
      h('div', { class: 'home-actions' },
        h('p', { class: 'greeting' }, done ? "Today's quest is done! You can play another if you like." : "Ready for today's quest?"),
        h('button', { class: 'btn primary huge', type: 'button', onClick: () => app.go('session') }, icon('star'), done ? 'Play another quest' : "Start today's quest"),
        h('p', { class: 'where' }, m.cleared.size === app.catalog.islands.length ? 'Every island visited! Quests keep your spells shiny.' : `Next stop: ${isl.name} (${isl.table})`),
        h('div', { class: 'tiles' }, tile('Map', 'map', 'map'), tile('Magic Window', 'window', 'window'), tile('Boutique', 'wand', 'boutique')))),
    h('button', { class: 'grownups-link', type: 'button', onClick: () => app.go('grownups') }, 'Grown-ups'));
  return { el };
}
