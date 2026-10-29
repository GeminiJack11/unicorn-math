// Picnic: division as sharing treats out fairly, one round at a time. This picks which
// sharing problems to show. Picnic answers earn a little stardust but are never counted
// as evidence that she remembers a fact: she can always deal the treats out and count.
import { currentIsland } from './model.js';
export { PICNIC_DAILY_DUST } from './model.js';
import { shuffle } from './schedule.js';

export const PICNIC_ROUND = 5;

// Every sharing problem worth dealing out: at least 2 guests and something to share.
function sharable(cat) {
  return [...cat.items.values()].filter((it) => it.kind === 'div' && it.p > 0 && it.d >= 2 && it.d <= 10);
}

// Facts from families she has met, falling back to the next islands so a brand-new player
// still gets a picnic. Spells she has missed or is still learning come first.
export function planPicnic(m, { rng = Math.random, count = PICNIC_ROUND } = {}) {
  const all = sharable(m.catalog);
  const met = (it) => !!m.items.get(it.family)?.introduced;
  const reached = currentIsland(m);
  let pool = all.filter(met);
  if (pool.length < count) pool = all.filter((it) => met(it) || it.island <= Math.max(1, reached));
  const practice = (it) => {
    const s = m.items.get(it.id);
    return !!s && !s.everMastered && (s.box <= 2 || s.hist.includes('0'));
  };
  // Sharing 1 each (7 ÷ 7) is a fine surprise now and then, not a whole round.
  const interesting = pool.filter((it) => it.answer >= 2);
  const first = shuffle(interesting.filter(practice), rng).slice(0, Math.ceil(count / 2));
  const rest = shuffle(pool.filter((it) => !first.includes(it)), rng);
  // Different families where possible, so one round isn't 42 ÷ 6 and then 42 ÷ 7.
  const picked = [...first];
  for (const it of rest) if (picked.length < count && !picked.some((p) => p.family === it.family)) picked.push(it);
  for (const it of rest) if (picked.length < count && !picked.includes(it)) picked.push(it);
  return shuffle(picked, rng).map((it) => it.id);
}
