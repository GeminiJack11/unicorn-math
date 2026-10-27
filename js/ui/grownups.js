// The grown-ups page: honest current status of every fact, practice time, settings and
// backups. Behind a press-and-hold so it isn't opened by accident mid-game.
import { h, icon, modal, toast } from './dom.js';
import { parseBackup } from '../store/db.js';
import { isMastered, currentIsland } from '../engine/model.js';
import { mulId, divId } from '../engine/facts.js';
import { localDay, addDays } from '../engine/log.js';
import { QUEST_LENGTHS } from './session.js';

const STATUS = {
  none: ['Not started', '#eee8f7'],
  shaky: ['Still tricky', '#ffb3a7'],
  growing: ['Getting there', '#ffe08a'],
  solid: ['Knows it by heart', '#7fdca0'],
  review: ['Needs a refresh', '#ffc4e1'],
};

function statusOf(s) {
  if (!s || !s.introduced) return 'none';
  if (isMastered(s)) return 'solid';
  if (s.everMastered) return 'review';
  if (s.box <= 1 || s.hist.slice(-3).includes('0')) return 'shaky';
  return 'growing';
}

function factLabel(it) {
  return it.kind === 'mul' ? `${it.a} × ${it.b} = ${it.answer}` : `${it.p} ÷ ${it.d} = ${it.answer}`;
}

function detail(it, s) {
  if (!s?.introduced) return `${factLabel(it)}: not started yet.`;
  const misses = s.hist.split('').filter((x) => x === '0').length;
  const secs = s.ms ? ` Usually about ${(s.ms / 1000).toFixed(1)} s.` : '';
  return `${factLabel(it)}: ${STATUS[statusOf(s)][0].toLowerCase()}. Answered ${s.seen} times, missed ${misses} of the last ${s.hist.length}.${secs} Remembered easily on ${s.fluentDays.length} different day${s.fluentDays.length === 1 ? '' : 's'}.`;
}

export function grownupsScreen(app, { open = false } = {}) {
  const el = h('div', { class: 'screen grownups' });
  const back = () => app.go('home');
  const header = h('header', { class: 'topbar' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back home', onClick: back }, icon('back')),
    h('h1', { class: 'screen-title' }, 'Grown-ups'), h('div', {}));

  // Press and hold to open.
  const ring = h('div', { class: 'hold-fill' });
  let holdTimer = null;
  const start = (e) => {
    e.preventDefault();
    ring.classList.add('go');
    holdTimer = setTimeout(openDashboard, 1500);
  };
  const stop = () => {
    clearTimeout(holdTimer);
    ring.classList.remove('go');
  };
  const holdBtn = h('button', { class: 'btn hold', type: 'button', onPointerdown: start, onPointerup: stop, onPointerleave: stop, onPointercancel: stop }, ring, h('span', {}, 'Press and hold to open'));
  el.append(header, h('main', { class: 'gate' }, h('p', { class: 'big-line' }, 'This page is for grown-ups.'), holdBtn));

  function openDashboard() {
    el.replaceChildren(header, dashboard(app));
  }
  if (open) openDashboard();
  return { el };
}

function dashboard(app) {
  const m = app.model;
  const cat = app.catalog;
  const today = localDay(Date.now());
  const all = [...cat.items.values()];
  const muls = all.filter((i) => i.kind === 'mul');
  const divs = all.filter((i) => i.kind === 'div');
  const known = (list) => list.filter((it) => isMastered(m.items.get(it.id))).length;
  let total = { n: 0, ok: 0, ms: 0 };
  let week = { n: 0, ok: 0, ms: 0 };
  for (const [day, d] of m.days) {
    total = { n: total.n + d.n, ok: total.ok + d.ok, ms: total.ms + d.ms };
    if (day > addDays(today, -7)) week = { n: week.n + d.n, ok: week.ok + d.ok, ms: week.ms + d.ms };
  }
  const mins = (ms) => Math.round(ms / 60000);
  const strip = [...Array(14)].map((_, k) => {
    const day = addDays(today, k - 13);
    const d = m.days.get(day);
    return h('span', { class: `day ${d?.sessions ? 'on' : ''}`, title: day });
  });

  const detailLine = h('p', { class: 'cell-detail' }, 'Tap any square for details.');
  const cell = (it, label) => {
    const s = m.items.get(it.id);
    const st = statusOf(s);
    return h('button', { class: 'cell', type: 'button', style: { background: STATUS[st][1] }, title: detail(it, s), onClick: () => { detailLine.textContent = detail(it, s); } }, label);
  };
  const mulGrid = h('div', { class: 'heat', style: { gridTemplateColumns: 'repeat(12, 1fr)' } },
    h('span', { class: 'hd' }, '×'), [...Array(11)].map((_, c) => h('span', { class: 'hd' }, c)),
    [...Array(11)].flatMap((_, r) => [h('span', { class: 'hd' }, r), ...[...Array(11)].map((__, c) => cell(cat.items.get(mulId(r, c)), r * c))]));
  const divGrid = h('div', { class: 'heat', style: { gridTemplateColumns: 'repeat(12, 1fr)' } },
    h('span', { class: 'hd' }, '÷'), [...Array(11)].map((_, q) => h('span', { class: 'hd' }, `=${q}`)),
    [...Array(10)].flatMap((_, k) => {
      const d = k + 1;
      return [h('span', { class: 'hd' }, `÷${d}`), ...[...Array(11)].map((__, q) => cell(cat.items.get(divId(d * q, d)), d * q))];
    }));
  const legend = h('div', { class: 'legend' }, Object.values(STATUS).map(([label, color]) => h('span', {}, h('i', { style: { background: color } }), label)));

  const tricky = all.map((it) => ({ it, s: m.items.get(it.id) }))
    .filter(({ s }) => s?.introduced && !isMastered(s) && s.hist.includes('0'))
    .map((x) => ({ ...x, score: x.s.hist.split('').filter((c) => c === '0').length * 2 + (x.s.ms || 0) / 3000 }))
    .sort((a, b) => b.score - a.score).slice(0, 8);

  const seg = (key, options, current) => h('div', { class: 'seg', role: 'group' }, options.map(([value, label]) =>
    h('button', { class: `seg-btn ${current === value ? 'on' : ''}`, type: 'button', 'aria-pressed': String(current === value),
      onClick: () => { app.setSetting(key, value); app.go('grownups', { open: true }); } }, label)));
  const titleInput = h('input', { class: 'text-input', type: 'text', maxlength: '28', value: m.settings.title || 'Rainbow Isles', 'aria-label': 'Game title' });
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden-file' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const added = await app.store.merge(parseBackup(await file.text()));
      app.refold();
      toast(added ? `Combined ${added} saved steps into this device.` : 'Nothing new in that backup.');
      app.go('grownups', { open: true });
    } catch (err) {
      toast(`Couldn't read that file: ${err.message}`);
    }
  });
  const persisted = h('span', {}, 'Checking…');
  app.store.persist().then((ok) => {
    persisted.textContent = !app.store.saving ? 'Progress is NOT being saved on this device (storage is blocked).'
      : ok ? 'This browser has agreed to keep the progress safe.' : 'Tip: install the app (see below) so the browser keeps progress safe.';
  });

  return h('main', { class: 'dash' },
    h('section', { class: 'panel' }, h('h2', {}, 'At a glance'),
      h('div', { class: 'kpis' },
        h('div', { class: 'kpi' }, h('b', {}, `${known(muls)} / ${muls.length}`), h('span', {}, '× facts known by heart')),
        h('div', { class: 'kpi' }, h('b', {}, `${known(divs)} / ${divs.length}`), h('span', {}, '÷ facts known by heart')),
        h('div', { class: 'kpi' }, h('b', {}, `${mins(week.ms)} min`), h('span', {}, `practiced in the last 7 days (${mins(total.ms)} min total)`)),
        h('div', { class: 'kpi' }, h('b', {}, week.n ? `${Math.round((100 * week.ok) / week.n)}%` : '—'), h('span', {}, `right answers in the last 7 days (${week.n} answered)`))),
      h('p', {}, `Current island: ${cat.islands[currentIsland(m)].name}. Days practiced, last two weeks:`),
      h('div', { class: 'strip' }, strip),
      h('p', { class: 'note' }, 'A fact counts as "known by heart" once it was answered correctly without counting it out on 3 different days. The game measures this quietly; she never sees a timer.')),
    h('section', { class: 'panel' }, h('h2', {}, 'Multiplication facts'), legend, mulGrid, detailLine,
      h('h2', {}, 'Division facts'), h('p', { class: 'note' }, 'Each row divides by one number; each square shows the number being divided.'), divGrid),
    h('section', { class: 'panel' }, h('h2', {}, 'Trickiest right now'),
      tricky.length ? h('ul', { class: 'tricky' }, tricky.map(({ it, s }) => h('li', {}, detail(it, s)))) : h('p', {}, 'Nothing is giving her trouble right now.')),
    h('section', { class: 'panel' }, h('h2', {}, 'Settings'),
      h('label', { class: 'field' }, h('span', {}, 'Game title'), h('div', { class: 'row' }, titleInput,
        h('button', { class: 'btn soft', type: 'button', onClick: () => { app.setSetting('title', titleInput.value.trim().slice(0, 28) || 'Rainbow Isles'); toast('Saved!'); } }, 'Save'))),
      h('div', { class: 'field' }, h('span', {}, 'Quest length'), seg('length', [['short', `Short (~${QUEST_LENGTHS.short} questions)`], ['normal', `Normal (~${QUEST_LENGTHS.normal})`], ['long', `Long (~${QUEST_LENGTHS.long})`]], m.settings.length || 'normal')),
      h('div', { class: 'field' }, h('span', {}, 'Thinking time'), seg('recall', [['normal', 'Normal'], ['relaxed', 'Relaxed']], m.settings.recall || 'normal'),
        h('p', { class: 'note' }, 'How quickly an answer has to come to count as "by heart". Choose Relaxed if typing is slow for her.')),
      h('div', { class: 'field' }, h('span', {}, 'Sound'), seg('sound', [['on', 'On'], ['off', 'Off']], m.settings.sound || 'on')),
      h('div', { class: 'field' }, h('span', {}, 'Motion'), seg('motion', [['normal', 'Normal'], ['calm', 'Calm (fewer effects)']], m.settings.motion || 'normal'))),
    h('section', { class: 'panel' }, h('h2', {}, 'Saving & other devices'),
      h('p', {}, persisted),
      h('p', {}, 'Progress is saved on this device only. To move it to another device (for example the tablet), download a backup here and restore it there. Restoring combines both devices\' progress; nothing is overwritten.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn soft', type: 'button', onClick: () => download(app) }, 'Download a backup'),
        h('button', { class: 'btn soft', type: 'button', onClick: () => fileInput.click() }, 'Restore from a backup'), fileInput),
      h('h3', {}, 'Installing it like an app'),
      h('p', {}, 'Chromebook: open the game in Chrome, then use the Install icon in the address bar (or the ⋮ menu → Cast, save, and share → Install page as app).'),
      h('p', {}, 'Android tablet: open it in Chrome, tap ⋮ → Add to Home screen → Install.'),
      h('p', {}, 'If her account uses Family Link with "approved sites only", add the game\'s web address to the approved list first.'),
      h('h3', {}, 'Start over'),
      h('button', { class: 'btn danger', type: 'button', onClick: () => startOver(app) }, 'Erase all progress on this device')));
}

function download(app) {
  const blob = new Blob([app.store.backup()], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `rainbow-isles-backup-${localDay(Date.now())}.json` });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

function startOver(app) {
  modal({
    title: 'Erase everything?',
    body: h('p', {}, 'This removes her unicorn, stardust and all progress from this device. Consider downloading a backup first.'),
    actions: [['Cancel', null, 'btn soft'], ['Erase', () => {
      modal({
        title: 'Are you sure?',
        body: h('p', {}, 'This cannot be undone.'),
        actions: [['Cancel', null, 'btn soft'], ['Yes, erase it all', () => {
          app.store.clear().then(() => {
            app.refold();
            app.go('hatch');
          });
        }, 'btn danger']],
      });
    }, 'btn danger']],
  });
}
