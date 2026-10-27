// Everything she can dress her unicorn in. Prices are in stardust; free items are hers from
// the start, and island rewards arrive when she befriends that island's animal.
import { befriended } from '../engine/model.js';

const item = (slot, key, name, cost, value, extra = {}) => ({ id: `${slot}:${key}`, slot, name, cost, value, ...extra });

export const COATS = [
  item('coat', 'snow', 'Snow', 0, '#fffafd'),
  item('coat', 'blush', 'Blush', 0, '#ffe4f0'),
  item('coat', 'lilac', 'Lilac', 0, '#ece0ff'),
  item('coat', 'sky', 'Sky', 0, '#ddf1ff'),
  item('coat', 'mint', 'Mint', 0, '#dbf8ec'),
  item('coat', 'butter', 'Butter', 0, '#fff3c9'),
  item('coat', 'peach', 'Peach', 15, '#ffd8c4'),
  item('coat', 'rose', 'Rose', 15, '#ffc3dc'),
  item('coat', 'lavender', 'Lavender', 15, '#d6c5ff'),
  item('coat', 'seafoam', 'Seafoam', 15, '#b9eedf'),
  item('coat', 'cocoa', 'Cocoa', 15, '#c99f84'),
  item('coat', 'silver', 'Silver', 20, '#d7dbe8'),
  item('coat', 'midnight', 'Midnight', 25, '#5a5da6'),
  item('coat', 'galaxy', 'Galaxy', 30, '#3a3472'),
];

export const MANES = [
  item('mane', 'rainbow', 'Rainbow', 0, ['#ff7eb6', '#ffb86b', '#ffe066', '#7ee0a1', '#7cc8ff', '#b18cff']),
  item('mane', 'candy', 'Candy', 0, ['#ff8fc8', '#c99bff']),
  item('mane', 'ocean', 'Ocean', 0, ['#6fd3ff', '#5aa1ff', '#8eeedf']),
  item('mane', 'sunshine', 'Sunshine', 0, ['#ffd45e', '#ffa95e']),
  item('mane', 'sunset', 'Sunset', 20, ['#ff7a7a', '#ffb36b', '#ff7ab8']),
  item('mane', 'mint', 'Mint Swirl', 20, ['#7ef0c8', '#b8f5a0', '#ffffff']),
  item('mane', 'berry', 'Berry', 20, ['#d6336c', '#ff6fa8']),
  item('mane', 'cloud', 'Cloud', 20, ['#ffffff', '#dfe4ff']),
  item('mane', 'galaxy', 'Galaxy', 25, ['#5b3cc4', '#a05cff', '#3b82f6']),
  item('mane', 'fire', 'Fire', 25, ['#ff5e3a', '#ffb03a', '#ffe03a']),
  item('mane', 'chestnut', 'Chestnut', 0, ['#8a5a3c', '#6b4429'], { hidden: true }),
  item('mane', 'prism', 'Prism', 0, ['#ff9ad5', '#ffd59a', '#fff59a', '#a8ffcf', '#9ad8ff', '#c9a8ff', '#ffffff'], { reward: 'rainbow' }),
];

export const HORNS = [
  item('horn', 'gold', 'Gold', 0, '#ffd56b'),
  item('horn', 'silver', 'Silver', 0, '#e3e7f2'),
  item('horn', 'pink', 'Pink', 0, '#ffb3d9'),
  item('horn', 'crystal', 'Crystal', 15, '#bdf0ff'),
  item('horn', 'violet', 'Violet', 15, '#c4a3ff'),
  item('horn', 'rainbow', 'Rainbow', 30, 'rainbow'),
];

export const EYES = [
  item('eye', 'violet', 'Violet', 0, '#6a3fb5'),
  item('eye', 'brown', 'Brown', 0, '#7a4a2b'),
  item('eye', 'blue', 'Blue', 0, '#2f74d0'),
  item('eye', 'green', 'Green', 0, '#2f9e6a'),
  item('eye', 'pink', 'Pink', 0, '#d6409f'),
  item('eye', 'night', 'Night', 0, '#2a2240'),
];

export const PATTERNS = [
  item('pattern', 'none', 'None', 0, null),
  item('pattern', 'freckles', 'Freckles', 15, 'freckles'),
  item('pattern', 'spots', 'Spots', 20, 'spots'),
  item('pattern', 'stars', 'Stars', 25, 'stars'),
  item('pattern', 'hearts', 'Hearts', 25, 'hearts'),
  item('pattern', 'sparkles', 'Sparkles', 30, 'sparkles'),
];

export const HEADS = [
  item('head', 'none', 'None', 0, null),
  item('head', 'bow', 'Bow', 20, 'bow'),
  item('head', 'starclip', 'Star Clip', 20, 'starclip'),
  item('head', 'flowers', 'Flower Crown', 30, 'flowers'),
  item('head', 'tiara', 'Tiara', 40, 'tiara'),
  item('head', 'daisy', 'Daisy Chain', 0, 'daisy', { reward: 'glade' }),
  item('head', 'starfish', 'Starfish Clip', 0, 'starfish', { reward: 'starfish' }),
  item('head', 'leaves', 'Leaf Crown', 0, 'leaves', { reward: 'sloth' }),
];

export const NECKS = [
  item('neck', 'none', 'None', 0, null),
  item('neck', 'scarf', 'Cozy Scarf', 20, 'scarf'),
  item('neck', 'bowtie', 'Bow Tie', 20, 'bowtie'),
  item('neck', 'locket', 'Heart Locket', 25, 'locket'),
  item('neck', 'twinstars', 'Twin Stars', 0, 'twinstars', { reward: 'twins' }),
  item('neck', 'bell', 'Cat Bell', 0, 'bell', { reward: 'cat' }),
  item('neck', 'horseshoe', 'Lucky Horseshoe', 0, 'horseshoe', { reward: 'pony' }),
  item('neck', 'beescarf', 'Bee Scarf', 0, 'beescarf', { reward: 'bee' }),
  item('neck', 'pearls', 'Pearls', 0, 'pearls', { reward: 'octopus' }),
];

export const SLOTS = [
  { key: 'coat', label: 'Coat', items: COATS },
  { key: 'mane', label: 'Mane', items: MANES },
  { key: 'horn', label: 'Horn', items: HORNS },
  { key: 'eye', label: 'Eyes', items: EYES },
  { key: 'pattern', label: 'Pattern', items: PATTERNS },
  { key: 'head', label: 'Head', items: HEADS },
  { key: 'neck', label: 'Neck', items: NECKS },
];

const BY_ID = new Map(SLOTS.flatMap((s) => s.items.map((i) => [i.id, i])));

export const findItem = (id) => BY_ID.get(id) || null;

export const DEFAULT_LOOK = {
  coat: 'coat:snow', mane: 'mane:rainbow', horn: 'horn:gold', eye: 'eye:violet',
  pattern: 'pattern:none', head: 'head:none', neck: 'neck:none',
};

// The colors and items a look stands for, falling back to defaults for anything unknown.
export function resolveLook(look) {
  const out = {};
  for (const { key, items } of SLOTS) {
    const it = findItem(look?.[key]) || findItem(DEFAULT_LOOK[key]) || items[0];
    out[key] = it.value;
  }
  return out;
}

export function rewardFor(islandId) {
  for (const it of BY_ID.values()) if (it.reward === islandId) return it;
  return null;
}

export function ownedSet(m) {
  const owned = new Set();
  for (const it of BY_ID.values()) {
    if (it.reward) {
      const idx = m.catalog.islands.findIndex((isl) => isl.id === it.reward);
      if (idx >= 0 && befriended(m, idx)) owned.add(it.id);
    } else if (it.cost === 0 || m.bought.has(it.id)) owned.add(it.id);
  }
  return owned;
}
