import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../js/engine/facts.js';
import { fold, applyEvent, emptyModel, isMastered } from '../js/engine/model.js';
import { makeEvent, mergeLogs, localDay, addDays } from '../js/engine/log.js';
import { planSession, SessionRunner, learningLoad } from '../js/engine/schedule.js';
import { trickFor } from '../js/engine/tricks.js';
import { simulateLearner, mulberry32 } from '../js/engine/sim.js';

const cat = buildCatalog();
const all = [...cat.items.values()];
const DAY = 86400000;
const start = new Date(2026, 9, 1, 16, 0, 0).getTime();

function snapshot(m) {
  return JSON.stringify({
    items: [...m.items].sort(([a], [b]) => (a < b ? -1 : 1)),
    name: m.name, look: m.look, settings: m.settings, bought: [...m.bought].sort(),
    earned: m.earned, spent: m.spent, days: [...m.days].sort(), cleared: [...m.cleared].sort(),
    recent: m.recent, quickMs: m.quickMs, divProbes: m.divProbes,
  });
}

function answer(m, t, item, ctx, ok, fluent, ms = fluent ? 2000 : 6000) {
  return applyEvent(m, makeEvent('dev1', t, 'answer', { item, ctx, ok, fluent, ms }));
}

test('0–10 has 66 multiplication families and 110 division facts', () => {
  assert.equal(all.filter((i) => i.kind === 'mul').length, 66);
  assert.equal(all.filter((i) => i.kind === 'div').length, 110);
});

test('after the glade, islands teach 8, 7, 6, 5, 4, 3, 2, 1 new families', () => {
  assert.deepEqual(cat.islands.map((i) => i.families.length), [30, 8, 7, 6, 5, 4, 3, 2, 1]);
  assert.deepEqual(cat.islands.at(-1).families, ['m7x7']);
});

test('there is never a division by zero, and every division fact checks out', () => {
  for (const it of all.filter((i) => i.kind === 'div')) {
    assert.notEqual(it.d, 0, it.id);
    assert.equal(it.answer * it.d, it.p, it.id);
  }
});

test('every fact belongs to exactly one lesson', () => {
  const seen = new Map();
  for (const l of cat.lessons) for (const id of l.items) seen.set(id, (seen.get(id) || 0) + 1);
  assert.equal(seen.size, cat.items.size);
  for (const [id, n] of seen) assert.equal(n, 1, id);
});

test('every fact has a trick with steps', () => {
  for (const it of all) {
    const t = trickFor(it);
    assert.ok(t.steps.length > 0 && t.picture, it.id);
  }
});

test('merging two devices\' logs is order-independent and idempotent', () => {
  const a = simulateLearner(cat, { days: 6, start, seed: 1, dev: 'aaaaaa' }).events;
  const b = simulateLearner(cat, { days: 6, start: start + 3 * DAY + 5000, seed: 2, dev: 'bbbbbb', knows: [0, 1, 10, 2] }).events;
  const ab = mergeLogs(a, b);
  assert.equal(ab.length, a.length + b.length);
  assert.equal(snapshot(fold(cat, ab)), snapshot(fold(cat, mergeLogs(b, a))));
  assert.equal(snapshot(fold(cat, mergeLogs(a, a))), snapshot(fold(cat, a)));
  assert.equal(snapshot(fold(cat, mergeLogs(ab, a))), snapshot(fold(cat, ab)));
});

test('a fact is learned after easy recalls on 3 different days, not 3 in one day', () => {
  const m = emptyModel(cat);
  answer(m, start, 'm6x8', 'lesson', true, false);
  answer(m, start + 60000, 'm6x8', 'repeat', true, true);
  answer(m, start + 120000, 'm6x8', 'repeat', true, true);
  assert.equal(m.items.get('m6x8').fluentDays.length, 0, 'same-day repeats are not evidence');
  answer(m, start + DAY, 'm6x8', 'q', true, true);
  answer(m, start + DAY + 60000, 'm6x8', 'q', true, true);
  answer(m, start + 3 * DAY, 'm6x8', 'q', true, true);
  assert.ok(!isMastered(m.items.get('m6x8')));
  answer(m, start + 5 * DAY, 'm6x8', 'q', true, true);
  const s = m.items.get('m6x8');
  assert.ok(isMastered(s));
  assert.ok(s.everMastered);
});

test('typing the answer during a hint changes nothing', () => {
  const m = emptyModel(cat);
  answer(m, start, 'm6x8', 'q', false, false);
  const before = snapshot(m);
  answer(m, start + 1000, 'm6x8', 'retry', true, true);
  assert.equal(snapshot(m), before);
});

test('a miss sends a fact back to box 1 but never un-learns it in the window', () => {
  const m = emptyModel(cat);
  for (const d of [0, 2, 5]) answer(m, start + d * DAY, 'd56/8', 'q', true, true);
  assert.ok(m.items.get('d56/8').everMastered);
  answer(m, start + 9 * DAY, 'd56/8', 'q', false, false);
  const s = m.items.get('d56/8');
  assert.equal(s.box, 1);
  assert.ok(!isMastered(s));
  assert.ok(s.everMastered);
});

test('a rule fact she already knows jumps ahead on the first try', () => {
  const m = emptyModel(cat);
  applyEvent(m, makeEvent('dev1', start, 'intro', { lesson: 'rule:x1', items: cat.lessonById.get('rule:x1').items }));
  answer(m, start + 1000, 'm1x7', 'q', true, true);
  const s = m.items.get('m1x7');
  assert.equal(s.box, 4);
  assert.equal(s.due, addDays(localDay(start), 4));
});

test('days are local calendar days', () => {
  const late = new Date(2026, 9, 1, 23, 59).getTime();
  const early = new Date(2026, 9, 2, 0, 1).getTime();
  assert.equal(localDay(late), '2026-10-01');
  assert.equal(localDay(early), '2026-10-02');
});

test('the first quest teaches the glade rules and asks only glade facts', () => {
  const m = emptyModel(cat);
  const plan = planSession(m, { now: start, rng: mulberry32(3) });
  const lessons = plan.cards.filter((c) => c.type === 'lesson').map((c) => c.lesson);
  assert.deepEqual(lessons, ['rule:x1', 'rule:x10', 'rule:x0']);
  const qs = plan.cards.filter((c) => c.type === 'q');
  assert.ok(qs.length >= 16 && qs.length <= 24, `${qs.length} questions`);
  for (const c of qs) assert.equal(cat.items.get(c.item).island, 0);
  // A ×0 fact is never asked before the ×0 lesson.
  const x0Lesson = plan.cards.findIndex((c) => c.lesson === 'rule:x0');
  plan.cards.forEach((c, i) => {
    if (c.type === 'q' && cat.items.get(c.item).teach === 0) assert.ok(i > x0Lesson, c.item);
  });
});

test('a learner who knows the 2s, 5s and 10s gets through those islands fast', () => {
  const sessions = [];
  const { model: m } = simulateLearner(cat, { days: 4, start, knows: [0, 1, 2, 5, 10], seed: 11,
    onSession: ({ m: mm, questions }) => sessions.push({ cleared: mm.cleared.size, questions }) });
  assert.ok(m.cleared.has(0) && m.cleared.has(1) && m.cleared.has(2), `cleared ${[...m.cleared]}`);
  const jumped = cat.islands[1].families.filter((id) => m.items.get(id).box >= 4);
  assert.ok(jumped.length >= 6, `only ${jumped.length} of the 2s jumped ahead`);
  // Known facts aren't due again tomorrow.
  const tomorrow = addDays(localDay(start + 3 * DAY), 1);
  const later = cat.islands[2].families.filter((id) => m.items.get(id).due > tomorrow);
  assert.ok(later.length >= 5, `only ${later.length} of the 5s are spaced out`);
  for (let i = 1; i < sessions.length; i++) assert.ok(sessions[i].cleared >= sessions[i - 1].cleared);
});

test('quests stay a sensible length and the learning load stays capped', () => {
  let maxQ = 0;
  const maxLoad = { mul: 0, div: 0 };
  const { model: m } = simulateLearner(cat, { days: 40, start, knows: [0, 1, 10], seed: 5,
    onSession: ({ m: mm, questions }) => { maxQ = Math.max(maxQ, questions); const l = learningLoad(mm); maxLoad.mul = Math.max(maxLoad.mul, l.mul); maxLoad.div = Math.max(maxLoad.div, l.div); } });
  assert.ok(maxQ <= 40, `longest quest ${maxQ}`);
  // New lessons stop at 8 facts in progress, so a lesson day can only push a little past that.
  assert.ok(maxLoad.mul <= 10 && maxLoad.div <= 11, `max load ${JSON.stringify(maxLoad)}`);
  assert.equal(m.cleared.size, 9, `only ${m.cleared.size} islands cleared in 40 days`);
});

test('plans never repeat a fact except on purpose, and never divide by zero', () => {
  const rng = mulberry32(9);
  const { model: m } = simulateLearner(cat, { days: 12, start, seed: 4 });
  for (let k = 0; k < 20; k++) {
    const plan = planSession(m, { now: start + 12 * DAY, rng });
    const ids = plan.cards.filter((c) => c.type === 'q' || c.type === 'probe').map((c) => c.item);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.notEqual(cat.items.get(id).d, 0);
    const run = new SessionRunner(m, plan, rng);
    assert.ok(run.card);
  }
});
