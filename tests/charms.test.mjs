import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../js/engine/facts.js';
import { fold } from '../js/engine/model.js';
import { makeEvent } from '../js/engine/log.js';
import { cleanCharm, ERASER, TEXT_MAX } from '../js/engine/charms.js';
import { charmSVG } from '../js/art/charm.js';
import { openStore, parseBackup } from '../js/store/db.js';

const cat = buildCatalog();
const t0 = new Date(2026, 9, 1, 16, 0, 0).getTime();
const line = { c: 1, w: 1, pts: [100, 100, 300, 200, 500, 150] };
const charm = (t, family, data) => makeEvent('dev1', t, 'charm', { family, ...data });

test('the newest charm for a spell wins, and an empty one removes it', () => {
  const m1 = fold(cat, [charm(t0, 'm6x7', { strokes: [line], text: 'first' }), charm(t0 + 5, 'm6x7', { strokes: [], text: 'six and seven' })]);
  assert.equal(m1.charms.get('m6x7').text, 'six and seven');
  const m2 = fold(cat, [charm(t0, 'm6x7', { strokes: [line] }), charm(t0 + 5, 'm6x7', { strokes: [], text: '' })]);
  assert.equal(m2.charms.has('m6x7'), false);
});

test('charms only attach to multiplication families', () => {
  const m = fold(cat, [charm(t0, 'd42/6', { text: 'x' }), charm(t0 + 1, 'nope', { text: 'x' }), charm(t0 + 2, '__proto__', { text: 'x' })]);
  assert.equal(m.charms.size, 0);
});

test('drawings from a backup file are checked before they are kept', () => {
  const c = cleanCharm({
    strokes: [
      { c: 99, w: 1, pts: [1, 2] }, // no such ink
      { c: '1" onload="x', w: 1, pts: [1, 2] }, // not a number
      { c: 1, w: 7, pts: [1, 2] }, // no such pen
      { c: 2, w: 0, pts: [-50, 9e9, 'a', 3, NaN, 4, 10, 20] }, // clamped and filtered
      { c: 3, w: 2, pts: 'M0 0' },
    ],
    text: 'hi\u0000<b>\n there',
  });
  assert.equal(c.strokes.length, 1);
  assert.deepEqual(c.strokes[0], { c: 2, w: 0, pts: [0, 750, 10, 20] });
  assert.equal(c.text, 'hi <b> there');
  const svg = charmSVG(c);
  assert.ok(!svg.includes('onload') && !svg.includes('<b>'));
});

test('text is trimmed to the limit, and eraser-only drawings with no words are empty', () => {
  assert.equal(cleanCharm({ text: 'a'.repeat(500) }).text.length, TEXT_MAX);
  assert.equal(cleanCharm({ strokes: [{ c: ERASER, w: 2, pts: [1, 1, 50, 50] }], text: '  ' }), null);
  assert.equal(cleanCharm(null), null);
});

test('a huge drawing is capped instead of growing the save without limit', () => {
  const big = { c: 0, w: 0, pts: [...Array(20000)].map((_, i) => i % 700) };
  const c = cleanCharm({ strokes: [...Array(300)].map(() => big) });
  const total = c.strokes.reduce((n, s) => n + s.pts.length, 0);
  assert.ok(c.strokes.length <= 120 && total <= 6000, `${c.strokes.length} strokes, ${total} numbers`);
});

test('charms and picnic stardust travel to another device in a backup', async () => {
  const tablet = await openStore({ memory: true });
  tablet.append('name', { name: 'Pip' });
  tablet.append('charm', { family: 'm6x7', strokes: [line], text: 'six and seven' });
  tablet.append('picnic', { item: 'd42/6', solved: true });
  const chromebook = await openStore({ memory: true });
  await chromebook.merge(parseBackup(tablet.backup()));
  const m = fold(cat, chromebook.events);
  assert.equal(m.charms.get('m6x7').text, 'six and seven');
  assert.deepEqual(m.charms.get('m6x7').strokes, [line]);
  assert.equal(m.earned, 1);
});
