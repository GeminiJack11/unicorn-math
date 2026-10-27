// Before/after snapshots of progress, so the results screen can say what's new.
import { befriended, growth } from '../engine/model.js';
import { mulId } from '../engine/facts.js';

// Panes in the 10 × 10 Magic Window: 3 × 4 and 4 × 3 are separate panes of one fact.
export function litPanes(m) {
  let n = 0;
  for (let r = 1; r <= 10; r++) for (let c = 1; c <= 10; c++) if (m.items.get(mulId(r, c))?.everMastered) n++;
  return n;
}

export function snapshot(m) {
  const introduced = new Set();
  const mastered = new Set();
  for (const [id, s] of m.items) {
    if (s.introduced) introduced.add(id);
    if (s.everMastered) mastered.add(id);
  }
  const friends = new Set(m.catalog.islands.map((_, i) => i).filter((i) => befriended(m, i)));
  const g = growth(m);
  return { earned: m.earned, introduced, mastered, cleared: new Set(m.cleared), friends, stage: g.stage, wings: g.wings, lit: litPanes(m) };
}

export function changes(before, m) {
  const after = snapshot(m);
  const added = (a, b) => [...b].filter((x) => !a.has(x));
  return {
    stardust: after.earned - before.earned,
    learned: added(before.introduced, after.introduced),
    mastered: added(before.mastered, after.mastered),
    cleared: added(before.cleared, after.cleared),
    friends: added(before.friends, after.friends),
    grew: after.stage > before.stage,
    wings: after.wings && !before.wings,
    lit: after.lit - before.lit,
  };
}
