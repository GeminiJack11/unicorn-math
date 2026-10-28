import test from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, DEFAULT_LOOK, findItem, resolveLook, ownedSet } from '../js/art/catalog.js';
import { buildCatalog } from '../js/engine/facts.js';
import { emptyModel } from '../js/engine/model.js';

// Every id that shipped in the first version. Saved looks and 'buy' events store these, and
// anything unknown is silently dropped, so none of them may ever be renamed or removed.
const SHIPPED = {
  coat: ['snow', 'blush', 'lilac', 'sky', 'mint', 'butter', 'peach', 'rose', 'lavender', 'seafoam', 'cocoa', 'silver', 'midnight', 'galaxy'],
  mane: ['rainbow', 'candy', 'ocean', 'sunshine', 'sunset', 'mint', 'berry', 'cloud', 'galaxy', 'fire', 'chestnut', 'prism'],
  horn: ['gold', 'silver', 'pink', 'crystal', 'violet', 'rainbow'],
  eye: ['violet', 'brown', 'blue', 'green', 'pink', 'night'],
  pattern: ['none', 'freckles', 'spots', 'stars', 'hearts', 'sparkles'],
  head: ['none', 'bow', 'starclip', 'flowers', 'tiara', 'daisy', 'starfish', 'leaves'],
  neck: ['none', 'scarf', 'bowtie', 'locket', 'twinstars', 'bell', 'horseshoe', 'beescarf', 'pearls'],
};
const FREE_AT_FIRST = new Set(['coat:snow', 'coat:blush', 'coat:lilac', 'coat:sky', 'coat:mint', 'coat:butter',
  'mane:rainbow', 'mane:candy', 'mane:ocean', 'mane:sunshine', 'mane:chestnut', 'horn:gold', 'horn:silver', 'horn:pink',
  'eye:violet', 'eye:brown', 'eye:blue', 'eye:green', 'eye:pink', 'eye:night', 'pattern:none', 'head:none', 'neck:none']);

test('all 61 items from the first version still exist in the same slot', () => {
  const ids = Object.entries(SHIPPED).flatMap(([slot, keys]) => keys.map((k) => `${slot}:${k}`));
  assert.equal(ids.length, 61);
  for (const id of ids) assert.ok(findItem(id), `${id} is missing`);
});

test('nothing that was free has become something to buy', () => {
  for (const id of FREE_AT_FIRST) assert.equal(findItem(id).cost, 0, id);
});

test('every slot has a free default, and the defaults are owned from the start', () => {
  const owned = ownedSet(emptyModel(buildCatalog()));
  for (const { key } of SLOTS) {
    const it = findItem(DEFAULT_LOOK[key]);
    assert.ok(it, `no default for ${key}`);
    assert.equal(it.slot, key);
    assert.equal(it.cost, 0);
    assert.ok(owned.has(it.id));
  }
});

test('a look saved before the new slots existed gets the new defaults', () => {
  const old = { coat: 'coat:rose', mane: 'mane:sunset', horn: 'horn:pink', eye: 'eye:blue', pattern: 'pattern:hearts', head: 'head:bow', neck: 'neck:locket' };
  const r = resolveLook(old);
  assert.equal(r.coat, findItem('coat:rose').value);
  assert.equal(r.hair, 'classic');
  for (const key of ['face', 'outfit', 'tail', 'hoof', 'scene']) assert.equal(r[key], null, key);
});

test('item ids are unique and prices are whole, non-negative numbers', () => {
  const all = SLOTS.flatMap((s) => s.items);
  assert.equal(new Set(all.map((i) => i.id)).size, all.length);
  for (const it of all) assert.ok(Number.isInteger(it.cost) && it.cost >= 0, it.id);
});
