// Everything the game knows is derived by folding the event log in order, so two devices'
// logs merged together always produce the same progress.
import { localDay, addDays, compareEvents } from './log.js';

// Days until a fact comes back, by box. Box 1 = still learning (back today), 6 = solid.
export const INTERVALS = [0, 0, 1, 2, 4, 7, 14];
// A fact counts as learned once she recalls it easily on this many different days.
export const MASTERY_DAYS = 3;
export const SESSION_BONUS = 5;
export const MASTERY_BONUS = 10;

export function emptyModel(catalog) {
  return {
    catalog,
    items: new Map(),
    name: null,
    look: null,
    settings: {},
    bought: new Set(),
    earned: 0,
    spent: 0,
    days: new Map(),
    cleared: new Set(),
    recent: [],
    quickMs: [],
    lastT: 0,
  };
}

export function fold(catalog, events) {
  const m = emptyModel(catalog);
  for (const ev of [...events].sort(compareEvents)) applyEvent(m, ev);
  return m;
}

function itemState(m, id) {
  let s = m.items.get(id);
  if (!s) {
    s = { box: 0, due: null, introduced: false, probed: false, lastDay: null, fluentDays: [],
      seen: 0, right: 0, wrong: 0, ms: 0, hist: '', everMastered: false, masteredDay: null };
    m.items.set(id, s);
  }
  return s;
}

function dayStat(m, day) {
  let d = m.days.get(day);
  if (!d) {
    d = { n: 0, ok: 0, ms: 0, sessions: 0 };
    m.days.set(day, d);
  }
  return d;
}

export function applyEvent(m, ev) {
  if (ev.t > m.lastT) m.lastT = ev.t;
  switch (ev.type) {
    case 'name': m.name = String(ev.name ?? '').slice(0, 20); break;
    case 'look': m.look = ev.look; break;
    case 'setting': m.settings[ev.key] = ev.value; break;
    case 'buy':
      if (!m.bought.has(ev.item)) {
        m.bought.add(ev.item);
        m.spent += Math.max(0, Number(ev.cost) || 0);
      }
      break;
    case 'intro': applyIntro(m, ev); break;
    case 'answer': applyAnswer(m, ev); break;
    case 'session': applySession(m, ev); break;
  }
  return m;
}

function applyIntro(m, ev) {
  const day = localDay(ev.t);
  for (const id of ev.items || []) {
    if (!m.catalog.items.has(id)) continue;
    const s = itemState(m, id);
    if (!s.introduced) {
      s.introduced = true;
      s.due = day;
    }
  }
}

function applyAnswer(m, ev) {
  const item = m.catalog.items.get(ev.item);
  if (!item || ev.ctx === 'retry') return; // typing the answer shown in a hint isn't evidence
  const s = itemState(m, ev.item);
  const day = localDay(ev.t);
  const stat = dayStat(m, day);
  const first = s.lastDay !== day;
  s.lastDay = day;
  s.seen++;
  stat.n++;
  if (ev.ok) {
    s.right++;
    stat.ok++;
    m.earned += 1;
    if (ev.ms > 0) s.ms = s.ms ? Math.round(s.ms * 0.7 + ev.ms * 0.3) : ev.ms;
  } else if (!ev.skip) s.wrong++;
  if (!ev.skip) s.hist = (s.hist + (ev.ok ? '1' : '0')).slice(-8);
  if (first && ev.ctx === 'q') {
    m.recent.push(ev.ok ? 1 : 0);
    if (m.recent.length > 30) m.recent.shift();
    // Answers to the easiest facts show how long reading and tapping take her.
    if (ev.ok && item.rule && item.kind === 'mul' && item.teach !== 10 && ev.ms > 0) {
      m.quickMs.push(ev.ms);
      if (m.quickMs.length > 15) m.quickMs.shift();
    }
  }

  if (ev.ctx === 'probe') {
    s.probed = true;
    if (ev.ok) {
      s.introduced = true;
      if (ev.fluent) {
        s.box = Math.max(s.box, 4);
        addFluentDay(s, day);
      } else s.box = Math.max(s.box, 2);
    }
  } else if (ev.ctx === 'lesson') {
    s.introduced = true;
    s.box = Math.max(s.box, 1);
  } else {
    s.introduced = true;
    if (!ev.ok) {
      s.box = 1;
      s.fluentDays = [];
    } else if (first && ev.ctx === 'q') {
      if (ev.fluent) {
        // A fact she already knew the very first time she was asked jumps ahead.
        s.box = s.seen === 1 ? Math.max(s.box, 4) : Math.min(6, Math.max(s.box, 1) + 1);
        addFluentDay(s, day);
      } else s.box = Math.min(Math.max(s.box, 2), 3);
    } else if (s.box < 2) s.box = 2;
  }
  if (s.introduced) s.due = addDays(day, INTERVALS[s.box]);
  if (!s.everMastered && s.fluentDays.length >= MASTERY_DAYS) {
    s.everMastered = true;
    s.masteredDay = day;
    m.earned += MASTERY_BONUS;
  }
  if (!m.cleared.has(item.island) && islandCleared(m, item.island)) m.cleared.add(item.island);
}

function addFluentDay(s, day) {
  if (!s.fluentDays.includes(day)) s.fluentDays.push(day);
}

function applySession(m, ev) {
  if (ev.phase !== 'end') return;
  const d = dayStat(m, localDay(ev.t));
  d.ms += Math.min(Math.max(0, Number(ev.ms) || 0), 3600000);
  if (ev.done) {
    d.sessions++;
    if (d.sessions <= 3) m.earned += SESSION_BONUS;
  }
}

// An island is cleared once every family on it has been answered right outside a lesson.
// The glade teaches rules, so four facts per rule is enough. Cleared islands stay cleared.
export function islandCleared(m, index) {
  const isl = m.catalog.islands[index];
  const solid = (id) => {
    const s = m.items.get(id);
    return !!s && (s.box >= 2 || s.everMastered);
  };
  if (isl.rules) {
    return [0, 1, 10].every((f) =>
      isl.families.filter((id) => m.catalog.items.get(id).teach === f && solid(id)).length >= 4);
  }
  return isl.families.every(solid);
}

export const isMastered = (s) => !!s && s.fluentDays.length >= MASTERY_DAYS;
export const isUnlocked = (m, index) => index === 0 || m.cleared.has(index - 1);
export const stardust = (m) => m.earned - m.spent;

export function currentIsland(m) {
  const n = m.catalog.islands.length;
  for (let i = 0; i < n; i++) if (!m.cleared.has(i)) return i;
  return n - 1;
}

export function befriended(m, index) {
  return m.catalog.islands[index].families.every((id) => m.items.get(id)?.everMastered);
}

export function growth(m) {
  let total = 0;
  let learned = 0;
  for (const it of m.catalog.items.values()) {
    if (it.kind !== 'mul') continue;
    total++;
    if (m.items.get(it.id)?.everMastered) learned++;
  }
  const f = learned / total;
  return { stage: f >= 0.6 ? 2 : f >= 0.25 ? 1 : 0, age: f >= 0.6 ? 1 : f >= 0.25 ? 0.55 : 0.15,
    wings: learned === total, learned, total };
}

export function practicedToday(m, now = Date.now()) {
  return (m.days.get(localDay(now))?.sessions || 0) > 0;
}
