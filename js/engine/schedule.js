// Builds each quest and runs it: probes to find facts she already knows, lessons for the
// ones she doesn't, review of facts that are due, and repeats after a miss.
import { localDay } from './log.js';
import { currentIsland, isMastered } from './model.js';

// How many × and ÷ facts she is still in the middle of learning. Facts she gets right but
// slowly count half; rules don't count at all (they're easy).
export function learningLoad(m) {
  const load = { mul: 0, div: 0 };
  for (const [id, s] of m.items) {
    const it = m.catalog.items.get(id);
    if (!it || it.rule || !s.introduced || s.box > 2 || isMastered(s)) continue;
    load[it.kind] += s.box <= 1 || s.hist.slice(-3).includes('0') ? 1 : 0.5;
  }
  return load;
}

// New lessons per quest: fewer while she's juggling many new facts or missing a lot.
export function budgets(m) {
  const load = learningLoad(m);
  const acc = m.recent.length >= 8 ? m.recent.reduce((a, b) => a + b, 0) / m.recent.length : 1;
  const fam = load.mul >= 8 ? 0 : load.mul >= 5 || acc < 0.75 ? 1 : acc >= 0.9 && load.mul <= 2 ? 3 : 2;
  // If the division checks show she already knows her reverse spells, let more through.
  const knowsDiv = m.divProbes.length >= 4 && m.divProbes.reduce((a, b) => a + b, 0) / m.divProbes.length >= 0.8;
  const rev = load.div >= 8 || acc < 0.6 ? 0 : load.div >= 4 || acc < 0.8 ? 1 : knowsDiv && load.div <= 2 ? 4 : 2;
  return { fam, rev };
}

// An answer counts as "remembered" (not worked out) if it comes within this many ms.
// It's calibrated on her easiest answers, so slow typing or reading isn't held against her.
export function fluencyLimit(m) {
  const xs = [...m.quickMs].sort((a, b) => a - b);
  const base = xs.length >= 5 ? xs[xs.length >> 1] : 1800;
  const extra = m.settings.recall === 'relaxed' ? 3500 : 2000;
  return Math.min(8000, Math.max(3000, base + extra));
}

export function shuffle(list, rng = Math.random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function planSession(m, { now = Date.now(), rng = Math.random, length = 20, focus = null } = {}) {
  const cat = m.catalog;
  const today = localDay(now);
  const st = (id) => m.items.get(id);
  const known = (id) => !!st(id)?.introduced;
  const taken = new Set();
  const q = (item, ctx = 'q') => {
    taken.add(item);
    return { type: 'q', item, ctx, flip: rng() < 0.5 };
  };
  const budget = budgets(m);
  const blocks = [];
  const soon = []; // per rule lesson today: the facts it introduces
  let extra = 0; // questions the lessons and probes will add
  const room = () => length + 4 - 8 - extra; // always leave space for 8 review questions

  if (focus == null) {
    const isl = cat.islands[currentIsland(m)];
    let divRules = 0;
    for (const l of cat.lessons) {
      if (l.kind !== 'rule' || l.items.every(known)) continue;
      if (l.op === 'div') {
        if (!m.cleared.has(0) || budget.rev <= 0 || divRules++ > 0) continue;
        budget.rev--;
      }
      const fresh = shuffle(l.items.filter((id) => !known(id)), rng);
      const tries = fresh.splice(0, 2);
      soon.push(fresh);
      blocks.push([{ type: 'lesson', lesson: l.id }, ...tries.map((id) => q(id, 'lesson'))]);
      extra += tries.length;
    }
    if (!isl.rules) {
      // Families she didn't know when we checked earlier get taught first...
      const retry = isl.families.filter((id) => !known(id) && st(id)?.probed);
      for (const fam of retry.slice(0, budget.fam)) {
        blocks.push([{ type: 'lesson', lesson: `fam:${fam}` }, q(fam, 'lesson')]);
        extra += 3;
      }
      budget.fam = Math.max(0, budget.fam - retry.length);
      // ...then a first visit checks which of the island's spells she already knows.
      const fresh = isl.families.filter((id) => !known(id) && !st(id)?.probed).slice(0, Math.max(3, room()));
      if (fresh.length) {
        const teach = Math.min(budget.fam, fresh.length, Math.max(0, Math.floor((room() - fresh.length) / 3)));
        fresh.forEach((id) => taken.add(id));
        blocks.push([
          { type: 'island', island: isl.index },
          ...fresh.map((id) => ({ type: 'probe', item: id, flip: rng() < 0.5 })),
          { type: 'slot', kind: 'fam', families: fresh, max: teach },
        ]);
        extra += fresh.length + teach * 3;
      }
    }
    // Reverse spells (division) for families she has learned.
    for (const l of cat.lessons) {
      if (budget.rev <= 0 || room() < 3) break;
      if (l.kind !== 'reverse' || l.items.every(known)) continue;
      const fam = st(l.family);
      if (!fam || !(fam.box >= 2 || fam.everMastered)) continue;
      budget.rev--;
      const unprobed = l.items.filter((id) => !known(id) && !st(id)?.probed);
      l.items.forEach((id) => taken.add(id));
      blocks.push([...unprobed.map((id) => ({ type: 'probe', item: id, flip: false })),
        { type: 'slot', kind: 'rev', lesson: l.id }]);
      extra += unprobed.length + 2;
    }
  }

  // Review: facts that are due (most overdue first), plus easy ones so she mostly succeeds.
  const R = Math.max(8, length - extra);
  const pool = [];
  for (const [id, s] of m.items) {
    const it = cat.items.get(id);
    if (!it || !s.introduced || taken.has(id)) continue;
    if (focus != null && it.island !== focus) continue;
    pool.push({ id, box: s.box, due: s.due });
  }
  shuffle(pool, rng);
  const byDue = (x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : 0) || x.box - y.box;
  // Facts from today's rule lessons, taking turns between the rules so each gets practice.
  const freshAll = [];
  for (let k = 0; soon.some((list) => k < list.length); k++) {
    for (const list of soon) if (k < list.length) freshAll.push({ id: list[k], box: 0, due: today, fresh: true });
  }
  const old = pool.filter((p) => p.due && p.due <= today).sort(byDue);
  const freshN = Math.min(freshAll.length, Math.max(R - old.length, Math.min(6, freshAll.length)));
  const fresh = freshAll.slice(0, freshN);
  const due = old.slice(0, R - freshN);
  const dueIds = new Set(due.map((p) => p.id));
  const hard = due.filter((p) => p.box <= 2);
  const easy = due.filter((p) => p.box > 2);
  const rest = pool.filter((p) => !dueIds.has(p.id));
  const wantEasy = Math.max(R - due.length - fresh.length, Math.ceil(R * 0.35) - easy.length, 0);
  easy.push(...rest.filter((p) => p.box >= 3).sort((x, y) => y.box - x.box).slice(0, wantEasy));
  const missing = R - fresh.length - hard.length - easy.length;
  if (missing > 0) hard.push(...rest.filter((p) => p.box < 3).sort((x, y) => x.box - y.box).slice(0, missing));

  const cards = easy.splice(0, Math.min(2, easy.length)).map((p) => q(p.id));
  const mixed = [];
  while (hard.length || easy.length) {
    if (hard.length) mixed.push(q(hard.shift().id));
    if (easy.length) mixed.push(q(easy.shift().id));
  }
  for (const block of blocks) cards.push(...block, ...mixed.splice(0, 3));
  // Facts from today's rule lessons only come after those lessons.
  while (fresh.length || mixed.length) {
    if (fresh.length) cards.push(q(fresh.shift().id));
    if (mixed.length) cards.push(mixed.shift());
  }
  return { cards, today, cap: length + 10 };
}

// Steps through a planned quest. The UI logs each answer to the model before calling next(),
// so slots ("teach whatever the probes showed she doesn't know yet") see up-to-date state.
export class SessionRunner {
  constructor(m, plan, rng = Math.random) {
    this.m = m;
    this.cat = m.catalog;
    this.cards = plan.cards;
    this.cap = plan.cap || Infinity;
    this.i = 0;
    this.rng = rng;
    this.repeats = new Map();
    this.answered = 0;
    this.expand();
  }

  get card() {
    return this.cards[this.i] || null;
  }

  questionsLeft() {
    let left = 0;
    for (let j = this.i; j < this.cards.length; j++) {
      const t = this.cards[j].type;
      if (t === 'q' || t === 'probe') left++;
    }
    return left;
  }

  progress() {
    return this.answered / Math.max(1, this.answered + this.questionsLeft());
  }

  next(result = {}) {
    const card = this.card;
    if (!card) return null;
    if (card.type === 'q' || card.type === 'probe') {
      this.answered++;
      this.react(card, result);
    }
    this.i++;
    this.expand();
    return this.card;
  }

  react(card, r) {
    if (card.type === 'probe') {
      if (r.ok && !r.fluent) this.repeat(card.item, 4);
      return;
    }
    if (card.ctx === 'lesson') {
      if (this.cat.items.get(card.item).rule) return; // the rest of the rule's facts are the practice
      this.repeat(card.item, 3);
      this.repeat(card.item, 7);
    } else if (!r.ok) {
      this.repeat(card.item, 3);
      if (card.ctx !== 'repeat') this.repeat(card.item, 7);
    }
  }

  repeat(item, gap) {
    const n = this.repeats.get(item) || 0;
    if (n >= 2 || this.answered + this.questionsLeft() >= this.cap) return;
    this.repeats.set(item, n + 1);
    let at = Math.min(this.i + 1 + gap, this.cards.length);
    // Never split a lesson from the tries that follow it.
    while (at < this.cards.length && at > 0 && (['lesson', 'island'].includes(this.cards[at - 1].type)
      || (this.cards[at].type === 'q' && this.cards[at].ctx === 'lesson'))) at++;
    this.cards.splice(at, 0, { type: 'q', item, ctx: 'repeat', flip: this.rng() < 0.5 });
  }

  expand() {
    while (this.card && this.card.type === 'slot') {
      const slot = this.card;
      const fresh = (id) => !this.m.items.get(id)?.introduced;
      const add = [];
      if (slot.kind === 'fam') {
        for (const fam of slot.families.filter(fresh).slice(0, slot.max)) {
          add.push({ type: 'lesson', lesson: `fam:${fam}` }, { type: 'q', item: fam, ctx: 'lesson', flip: false });
        }
      } else {
        const l = this.cat.lessonById.get(slot.lesson);
        const need = l.items.filter(fresh);
        if (need.length) {
          add.push({ type: 'lesson', lesson: l.id, focus: need });
          for (const id of need) add.push({ type: 'q', item: id, ctx: 'lesson', flip: false });
        }
      }
      this.cards.splice(this.i, 1, ...add);
    }
  }
}
