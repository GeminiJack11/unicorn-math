import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../js/engine/facts.js';
import { fold, emptyModel, applyEvent, PICNIC_DAILY_DUST } from '../js/engine/model.js';
import { makeEvent } from '../js/engine/log.js';
import { planPicnic, PICNIC_ROUND } from '../js/engine/picnic.js';
import { mulberry32 } from '../js/engine/sim.js';

const cat = buildCatalog();
const start = new Date(2026, 9, 1, 16, 0, 0).getTime();

test('picnics leave every fact\'s progress alone', () => {
  const base = [makeEvent('dev1', start, 'answer', { item: 'm6x7', ctx: 'q', ok: false, fluent: false, ms: 9000 })];
  const picnics = [...Array(30)].map((_, i) => makeEvent('dev1', start + 1000 + i, 'picnic', { item: 'd42/6', solved: true, tries: 1, early: true }));
  const a = fold(cat, base);
  const b = fold(cat, [...base, ...picnics]);
  assert.deepEqual([...b.items], [...a.items]);
  assert.deepEqual([...b.cleared], [...a.cleared]);
  assert.deepEqual(b.recent, a.recent);
  assert.equal(b.items.has('d42/6'), false);
});

test('picnic stardust is capped per day, and the cap resets the next day', () => {
  const m = emptyModel(cat);
  for (let i = 0; i < 25; i++) applyEvent(m, makeEvent('dev1', start + i, 'picnic', { item: 'd12/3', solved: true }));
  assert.equal(m.earned, PICNIC_DAILY_DUST);
  for (let i = 0; i < 3; i++) applyEvent(m, makeEvent('dev1', start + 86400000 + i, 'picnic', { item: 'd12/3', solved: true }));
  assert.equal(m.earned, PICNIC_DAILY_DUST + 3);
});

test('unknown or unsolved picnic events earn nothing', () => {
  const m = emptyModel(cat);
  applyEvent(m, makeEvent('dev1', start, 'picnic', { item: 'd999/0', solved: true }));
  applyEvent(m, makeEvent('dev1', start + 1, 'picnic', { item: 'd12/3', solved: false }));
  assert.equal(m.earned, 0);
});

test('a picnic is a round of real sharing problems, even on a brand-new save', () => {
  const rng = mulberry32(7);
  for (let k = 0; k < 50; k++) {
    const plan = planPicnic(emptyModel(cat), { rng });
    assert.equal(plan.length, PICNIC_ROUND);
    assert.equal(new Set(plan).size, plan.length);
    for (const id of plan) {
      const it = cat.items.get(id);
      assert.equal(it.kind, 'div');
      assert.ok(it.p > 0 && it.d >= 2 && it.d <= 10, id);
      assert.equal(it.p, it.d * it.answer);
    }
  }
});

test('spells she has missed come up in her picnics', () => {
  const events = [];
  let t = start;
  for (const id of ['m2x3', 'm2x4', 'm2x5', 'm2x6', 'm2x7', 'm2x8', 'm2x9']) {
    events.push(makeEvent('dev1', t++, 'intro', { lesson: `fam:${id}`, items: [id] }));
    events.push(makeEvent('dev1', t++, 'answer', { item: id, ctx: 'q', ok: true, fluent: true, ms: 2000 }));
  }
  events.push(makeEvent('dev1', t++, 'answer', { item: 'd14/2', ctx: 'q', ok: false, fluent: false, ms: 9000 }));
  const m = fold(cat, events);
  const rng = mulberry32(3);
  let hits = 0;
  for (let k = 0; k < 40; k++) if (planPicnic(m, { rng }).includes('d14/2')) hits++;
  assert.ok(hits >= 30, `missed spell came up in ${hits} of 40 picnics`);
});
