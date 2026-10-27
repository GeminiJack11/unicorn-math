// A pretend learner. The tests use it to check pacing, and ?debug=week etc. use it to fill in
// realistic progress for screenshots without playing for weeks.
import { makeEvent } from './log.js';
import { emptyModel, applyEvent } from './model.js';
import { planSession, SessionRunner, fluencyLimit } from './schedule.js';

export function mulberry32(seed) {
  return function rand() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400000;

// `knows`: factors whose facts she already knows on day one. Everything else starts unknown
// and gets stronger with lessons, hints and practice, and fades a little overnight.
export function simulateLearner(catalog, { days = 7, start = Date.now() - days * DAY, knows = [0, 1, 10],
  seed = 7, perDay = 1, dev = 'sim001', look = null, name = 'Sparkle', length = 20, onSession = null } = {}) {
  const rng = mulberry32(seed);
  const events = [];
  const m = emptyModel(catalog);
  let t = start;
  const push = (type, data) => {
    const ev = makeEvent(dev, t, type, data);
    t += 1;
    events.push(ev);
    applyEvent(m, ev);
    return ev;
  };
  const strength = new Map();
  for (const it of catalog.items.values()) {
    const fam = catalog.items.get(it.family);
    const k = knows.includes(fam.a) || knows.includes(fam.b);
    strength.set(it.id, k ? (it.kind === 'mul' ? 0.97 : 0.9) : 0);
  }
  const bump = (id, by) => strength.set(id, Math.min(0.98, strength.get(id) + by));

  if (look) push('look', { look });
  if (name) push('name', { name });
  for (let day = 0; day < days; day++) {
    for (let k = 0; k < perDay; k++) {
      t = Math.max(t, start + day * DAY + (16 + k) * 3600000);
      const plan = planSession(m, { now: t, rng, length });
      const run = new SessionRunner(m, plan, rng);
      const limit = fluencyLimit(m);
      const sid = `s${t.toString(36)}`;
      const t0 = t;
      let questions = 0;
      push('session', { phase: 'start', s: sid });
      while (run.card) {
        const card = run.card;
        if (card.type === 'lesson') {
          const l = catalog.lessonById.get(card.lesson);
          if (l.kind === 'rule') push('intro', { lesson: l.id, items: l.items });
          for (const id of card.focus || l.items) bump(id, l.kind === 'rule' ? 0.6 : 0.45);
          t += 15000;
          run.next();
          continue;
        }
        if (card.type === 'island') {
          t += 4000;
          run.next();
          continue;
        }
        const sv = strength.get(card.item);
        const skip = card.type === 'probe' && sv < 0.3 && rng() < 0.7;
        const ok = !skip && rng() < sv;
        const ms = Math.round(ok ? (sv > 0.8 ? 1600 : 5200) + rng() * 1400 : 4000 + rng() * 4000);
        const fluent = ok && ms <= limit;
        t += ms;
        push('answer', { item: card.item, ctx: card.type === 'probe' ? 'probe' : card.ctx, ok, fluent, ms, s: sid,
          ...(skip ? { skip: true } : {}) });
        bump(card.item, ok ? 0.08 : 0.25);
        t += 1500;
        questions++;
        run.next({ ok, fluent });
      }
      push('session', { phase: 'end', s: sid, done: true, ms: t - t0 });
      onSession?.({ day, m, questions });
    }
    for (const [id, v] of strength) if (v < 0.95) strength.set(id, Math.max(0, v - 0.05));
  }
  return { events, model: m };
}
