// Fact families, the islands that teach them, and the lessons that introduce them.
// Pure data and functions (no DOM), so the engine also runs under `node --test`.

export const CORE_MAX = 10;

// Islands are visited in this order. Each one teaches the families that contain one of
// its factors and weren't taught earlier, so by the ×7s only 7 × 7 is left to learn.
export const ISLANDS = [
  { id: 'glade', name: 'Unicorn Glade', factors: [0, 1, 10], rules: true, table: '×1 ×10 ×0',
    friend: 'the Glade Unicorn', why: '"Uni" means one, like a unicorn\'s one horn!' },
  { id: 'twins', name: 'Twin Meadow', factors: [2], table: '×2', friend: 'the Twin Foals',
    why: 'Twins come in pairs, so ×2 is just doubling!' },
  { id: 'starfish', name: 'Starfish Cove', factors: [5], table: '×5', friend: 'the Starfish',
    why: 'A starfish has 5 arms.' },
  { id: 'cat', name: 'Cat Castle', factors: [9], table: '×9', friend: 'the Castle Cat',
    why: 'They say a cat has 9 lives.' },
  { id: 'pony', name: 'Pony Pasture', factors: [4], table: '×4', friend: 'the Pony',
    why: 'A pony has 4 hooves.' },
  { id: 'sloth', name: 'Sloth Jungle', factors: [3], table: '×3', friend: 'the Sloth',
    why: 'A three-toed sloth has 3 toes on each foot.' },
  { id: 'bee', name: 'Honeybee Hollow', factors: [6], table: '×6', friend: 'the Honeybee',
    why: 'A bee has 6 legs.' },
  { id: 'octopus', name: 'Octopus Lagoon', factors: [8], table: '×8', friend: 'the Octopus',
    why: 'An octopus has 8 arms.' },
  { id: 'rainbow', name: 'Rainbow Peak', factors: [7], table: '×7', friend: 'the Rainbow',
    why: 'A rainbow has 7 colors.' },
];

// The glade teaches rules rather than single facts: three for ×, then three for ÷.
const RULE_LESSONS = [
  { topic: 'x1', op: 'mul', teach: 1 },
  { topic: 'x10', op: 'mul', teach: 10 },
  { topic: 'x0', op: 'mul', teach: 0 },
  { topic: 'div1', op: 'div', teach: 1 },
  { topic: 'div10', op: 'div', teach: 10 },
  { topic: 'div0', op: 'div', teach: 0 },
];

export function mulId(a, b) {
  return a <= b ? `m${a}x${b}` : `m${b}x${a}`;
}

export function divId(p, d) {
  return `d${p}/${d}`;
}

// Which factor a family is taught by: the island's own factor, or for the glade the
// strongest rule (×0 beats ×1 beats ×10).
function teachingFactor(isl, a, b) {
  if (isl.rules) return a === 0 || b === 0 ? 0 : a === 1 || b === 1 ? 1 : 10;
  return isl.factors.includes(a) ? a : b;
}

export function buildCatalog(max = CORE_MAX) {
  const items = new Map();
  const islands = ISLANDS.map((isl, index) => ({ ...isl, index, families: [], divs: [] }));

  for (const isl of islands) {
    for (let a = 0; a <= max; a++) {
      for (let b = a; b <= max; b++) {
        const id = mulId(a, b);
        if (items.has(id) || !(isl.factors.includes(a) || isl.factors.includes(b))) continue;
        const teach = teachingFactor(isl, a, b);
        const other = teach === a ? b : a;
        items.set(id, { id, kind: 'mul', a, b, answer: a * b, island: isl.index, family: id,
          rule: !!isl.rules, teach, other });
        isl.families.push(id);
      }
    }
  }
  if (items.size !== ((max + 1) * (max + 2)) / 2) throw new Error(`Facts up to ${max} need more islands`);

  // Every family gives its reverse spells: p ÷ a and p ÷ b. Never ÷ 0, and a square gives one.
  for (const fam of [...items.values()]) {
    const { a, b, answer: p } = fam;
    const splits = [];
    if (a !== 0) splits.push([a, b]);
    if (b !== 0 && b !== a) splits.push([b, a]);
    for (const [d, q] of splits) {
      const id = divId(p, d);
      items.set(id, { id, kind: 'div', p, d, answer: q, island: fam.island, family: fam.id,
        rule: fam.rule, teach: fam.teach, other: fam.other });
      islands[fam.island].divs.push(id);
    }
  }

  const lessons = [];
  const glade = islands[0];
  for (const { topic, op, teach } of RULE_LESSONS) {
    const pool = op === 'mul' ? glade.families : glade.divs;
    lessons.push({ id: `rule:${topic}`, kind: 'rule', topic, op, island: 0,
      items: pool.filter((id) => items.get(id).teach === teach) });
  }
  for (const isl of islands.slice(1)) {
    for (const fam of isl.families) {
      lessons.push({ id: `fam:${fam}`, kind: 'family', op: 'mul', island: isl.index, family: fam, items: [fam] });
    }
  }
  for (const isl of islands.slice(1)) {
    for (const fam of isl.families) {
      lessons.push({ id: `rev:${fam}`, kind: 'reverse', op: 'div', island: isl.index, family: fam,
        items: isl.divs.filter((id) => items.get(id).family === fam) });
    }
  }

  return { max, items, islands, lessons, lessonById: new Map(lessons.map((l) => [l.id, l])) };
}

// How a question is written. `flip` swaps the factors of a multiplication (turn-around fact).
export function questionParts(item, flip = false) {
  if (item.kind === 'mul') {
    const [x, y] = flip ? [item.b, item.a] : [item.a, item.b];
    return { left: x, op: '×', right: y, answer: item.answer };
  }
  return { left: item.p, op: '÷', right: item.d, answer: item.answer };
}

export function factText(item, flip = false) {
  const q = questionParts(item, flip);
  return `${q.left} ${q.op} ${q.right} = ${q.answer}`;
}
