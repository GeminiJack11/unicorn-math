// Picnic: her unicorn hosts, and she shares treats fairly by dealing them out one round
// at a time, the way you'd really share. Played on its own from home, and used as the
// hint when she misses a division spell in a quest.
import { h, art, icon } from './dom.js';
import { burstAt } from './fx.js';
import { createKeypad } from './keypad.js';
import { dustPill } from './home.js';
import { unicornSVG, star } from '../art/unicorn.js';
import { friendSVG } from '../art/friends.js';
import { sfx } from '../audio/sfx.js';
import { planPicnic } from '../engine/picnic.js';
import { currentIsland, growth, PICNIC_DAILY_DUST } from '../engine/model.js';
import { localDay } from '../engine/log.js';

const O = 'stroke="#4b3366" stroke-width="1.3" stroke-linejoin="round"';
const TREATS = {
  strawberry: ['strawberries', `<path d="M10 18.5C4.5 15 3 9.5 5.5 7.2c2-1.6 7-1.6 9 0 2.5 2.3 1 7.8-4.5 11.3z" fill="#ff5c7a" ${O}/><path d="M5.8 7.4 7.6 3.6 10 6l2.4-2.4 1.8 3.8z" fill="#4fbf6a" ${O}/><g fill="#ffe3a3"><circle cx="8" cy="10.5" r=".8"/><circle cx="12" cy="10.5" r=".8"/><circle cx="10" cy="13.5" r=".8"/></g>`],
  cupcake: ['cupcakes', `<path d="M4.5 11h11l-1.6 7.5H6.1z" fill="#7cc8ff" ${O}/><path d="M3.5 11.2c-.6-3 2-4.6 3.6-4 .7-2.6 5.1-2.6 5.8 0 1.6-.6 4.2 1 3.6 4z" fill="#ffc6e2" ${O}/><circle cx="10" cy="4.6" r="1.9" fill="#ff4f7a" ${O}/>`],
  cookie: ['cookies', `<circle cx="10" cy="10.5" r="7.5" fill="#e6b071" ${O}/><g fill="#6b4429"><circle cx="7.5" cy="8.5" r="1.1"/><circle cx="12.5" cy="9" r="1"/><circle cx="9.5" cy="13" r="1.1"/><circle cx="13" cy="13.2" r=".8"/></g>`],
  apple: ['apples', `<path d="M10 6.5c-2-1.6-6.5-1-6.5 4 0 4.3 3 7.6 4.8 7.6 1 0 1.2-.6 1.7-.6s.7.6 1.7.6c1.8 0 4.8-3.3 4.8-7.6 0-5-4.5-5.6-6.5-4z" fill="#ff6b6b" ${O}/><path d="M10 6.5c0-2 .6-3.4 1.6-4.4" fill="none" ${O}/><path d="M11 4.6c1.6-1.6 3.6-1.2 4-.6-.6 1.4-2.4 2-4 .6z" fill="#4fbf6a" ${O}/>`],
  star: ['star cookies', `<path d="${star(10, 10.6, 8.4, 5, 0.5)}" fill="#ffd34d" ${O}/>`],
};
const treatSVG = (kind) => `<svg viewBox="0 0 20 20" aria-hidden="true">${TREATS[kind][1]}</svg>`;
const TREAT_KINDS = Object.keys(TREATS);

// Guests: the island friends she has met, then foals in party colors.
const FOALS = [['sky', 'ocean'], ['mint', 'sunshine'], ['peach', 'berry'], ['butter', 'candy'], ['lavender', 'mint'],
  ['rose', 'cloud'], ['seafoam', 'sunset'], ['silver', 'galaxy'], ['cocoa', 'fire'], ['blush', 'rainbow']];
function guestSVG(m, i) {
  const met = m.catalog.islands.filter((isl, k) => k <= currentIsland(m) || m.cleared.has(k));
  if (i < met.length) return friendSVG(met[i].id);
  const [coat, mane] = FOALS[(i - met.length) % FOALS.length];
  return unicornSVG({ coat: `coat:${coat}`, mane: `mane:${mane}`, horn: 'horn:gold' }, { crop: 'head', age: 0, cls: 'friend', label: 'a foal friend' });
}

// The blanket of guests and the basket. Tapping the basket deals one treat to the next
// guest; after one full round she can deal a whole round at once.
export function picnicBoard(app, { p, d, treat = 'strawberry', compact = false, host = null, onDealt }) {
  let dealt = 0;
  const plates = [...Array(d)].map((_, i) => {
    const pile = h('div', { class: 'pile' });
    const count = h('span', { class: 'plate-count' });
    return { el: h('div', { class: 'plate', 'data-plate': String(i) }, art(guestSVG(app.model, i), 'guest'), h('div', { class: 'dish' }, pile), count), pile, count, n: 0 };
  });
  const basketPile = h('div', { class: `pile basket-pile ${p > 40 ? 'many' : ''}` }, [...Array(p)].map(() => art(treatSVG(treat), 'treat')));
  const left = h('span', { class: 'basket-count' });
  const basket = h('button', { class: 'basket', type: 'button', 'data-basket': '', 'aria-label': 'Give out one treat', onClick: () => dealOne() },
    basketPile, left);
  const roundBtn = h('button', { class: 'btn soft deal-btn', type: 'button', hidden: true, onClick: () => dealUpTo(Math.min(p, (Math.floor(dealt / d) + 1) * d)) }, 'Deal a round');
  const restBtn = h('button', { class: 'btn soft deal-btn', type: 'button', hidden: true, onClick: () => dealUpTo(p) }, 'Deal the rest');

  function give(quiet) {
    const plate = plates[dealt % d];
    basketPile.lastElementChild?.remove();
    plate.pile.append(art(treatSVG(treat), quiet ? 'treat' : 'treat drop'));
    plate.n++;
    dealt++;
  }

  function dealOne() {
    if (dealt >= p) return;
    sfx.tap();
    give(false);
    update();
  }

  function dealUpTo(target) {
    if (dealt >= target) return;
    sfx.pop();
    while (dealt < target) give(true);
    update();
  }

  function update() {
    left.textContent = dealt >= p ? 'All shared!' : `${p - dealt} left`;
    plates.forEach((pl, i) => {
      pl.el.classList.toggle('next', dealt < p && i === dealt % d);
      pl.count.textContent = dealt >= p ? String(pl.n) : '';
    });
    roundBtn.hidden = dealt < d || dealt >= p;
    restBtn.hidden = dealt < 2 * d || dealt >= p;
    if (dealt >= p) {
      basket.disabled = true;
      onDealt?.();
    }
  }

  update();
  // Guests sit in one row, or two even rows when there are more than five.
  const cols = d <= 5 ? d : Math.ceil(d / 2);
  const el = h('div', { class: `picnic-board ${compact ? 'compact' : ''}` },
    h('div', { class: 'blanket', style: { gridTemplateColumns: `repeat(${cols}, minmax(0, var(--plate)))` } }, plates.map((pl) => pl.el)),
    h('div', { class: 'basket-row' }, host, basket, h('div', { class: 'deal-btns' }, roundBtn, restBtn)));
  return { el, finish: () => dealUpTo(p), dealt: () => dealt };
}

export const treatName = (kind) => TREATS[kind][0];

// A short picnic: a few sharing problems, then back home.
export function picnicScreen(app) {
  const m = app.model;
  const cat = app.catalog;
  const plan = planPicnic(m);
  const g = growth(m);
  const keypad = createKeypad();
  const pillSlot = h('div', {});
  const host = h('div', { class: 'picnic-host' });
  const boardSlot = h('div', { class: 'board-slot' });
  const side = h('div', { class: 'picnic-side' });
  let index = 0;
  let solved = 0;
  const drawHost = (mood = 'happy') => { host.innerHTML = unicornSVG(m.look, { age: g.age, wings: g.wings, mood }); };
  const drawPill = () => pillSlot.replaceChildren(dustPill(app.model));
  const dustToday = () => app.model.days.get(localDay(Date.now()))?.picnicDust || 0;

  function problem() {
    const item = cat.items.get(plan[index]);
    const { p, d, answer: q } = item;
    const treat = TREAT_KINDS[(index + p) % TREAT_KINDS.length];
    const t0 = performance.now();
    let typed = '';
    let tries = 0;
    let done = false;
    const answer = h('span', { class: 'answer' }, '?');
    const note = h('p', { class: 'q-note' }, 'Tap the basket to share them out. Or type the answer if you know it!');
    const after = h('div', { class: 'picnic-after' });
    const board = picnicBoard(app, { p, d, treat, host, onDealt: () => { if (!done) note.textContent = 'All shared out! How many did each friend get?'; } });
    boardSlot.replaceChildren(board.el);
    drawHost();
    side.replaceChildren(h('div', { class: 'card picnic-card pop-in' },
      h('div', { class: 'tag' }, `Picnic ${index + 1} of ${plan.length}`),
      h('p', { class: 'big-line' }, `Share ${p} ${treatName(treat)} fairly between ${d} friends.`),
      h('div', { class: 'problem small' }, h('span', {}, 'Each gets'), answer),
      note, after),
    h('div', { class: 'pad-wrap' }, keypad.el));
    keypad.setEnabled(true);
    keypad.bind({
      digit(dg) {
        if (done || typed.length >= 3) return;
        typed = typed === '0' ? dg : typed + dg;
        answer.textContent = typed;
        answer.classList.add('typed');
      },
      back() {
        if (done) return;
        typed = typed.slice(0, -1);
        answer.textContent = typed || '?';
      },
      enter() {
        if (done) return next();
        if (typed === '') return;
        tries++;
        if (Number(typed) === q) return success();
        sfx.oops();
        answer.classList.add('shake');
        note.textContent = board.dealt() >= p ? 'Count the treats on one plate.' : 'Not quite! Share them out and see.';
        setTimeout(() => {
          typed = '';
          answer.textContent = '?';
          answer.classList.remove('shake', 'typed');
        }, 450);
      },
    });

    function success() {
      done = true;
      const early = board.dealt() < p;
      app.log('picnic', { item: item.id, solved: true, tries, early, ms: Math.round(performance.now() - t0) });
      solved++;
      sfx.correct();
      burstAt(answer);
      drawHost('joy');
      drawPill();
      board.finish();
      note.textContent = early && tries === 1 ? 'You knew it! Look, everyone got the same.' : 'Fair and square! Everyone got the same.';
      after.replaceChildren(
        h('p', { class: 'big-line fact' }, `${p} ÷ ${d} = ${q}`),
        h('p', { class: 'line' }, `because ${d} × ${q} = ${p}`),
        h('button', { class: 'btn primary big', type: 'button', onClick: next }, index + 1 < plan.length ? 'Next picnic' : 'Finish'));
    }
  }

  function next() {
    index++;
    if (index < plan.length) return problem();
    keypad.bind(null);
    sfx.fanfare();
    drawHost('joy');
    boardSlot.replaceChildren();
    const capped = dustToday() >= PICNIC_DAILY_DUST;
    side.replaceChildren(h('div', { class: 'card picnic-card pop-in' },
      h('h2', {}, 'What a lovely picnic!'),
      h('p', { class: 'big-line' }, `You shared out ${solved} picnics fairly.`),
      capped ? h('p', { class: 'line' }, "That's all the picnic stardust for today. Quests earn more!") : null,
      h('div', { class: 'chips' },
        h('button', { class: 'btn soft big', type: 'button', onClick: () => app.go('picnic') }, 'Another picnic'),
        h('button', { class: 'btn primary big', type: 'button', onClick: () => app.go('home') }, 'Home'))));
  }

  drawPill();
  const el = h('div', { class: 'screen picnic' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back home', onClick: () => app.go('home') }, icon('back')),
      h('h1', { class: 'screen-title' }, 'Picnic'), pillSlot),
    h('main', { class: 'picnic-main' }, h('div', { class: 'picnic-left' }, boardSlot), side));
  problem();
  return { el, destroy() { keypad.destroy(); } };
}
