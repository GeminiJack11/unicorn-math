// Unicorn Tricks: how to work out each fact, as short steps plus a picture to draw.
// A picture is { kind: 'array', rows, cols, parts, labels, fade } or { kind: 'empty' }.

const RHYMES = {
  m3x4: '1, 2, 3, 4… 12 is 3 × 4!',
  m7x8: '5, 6, 7, 8… 56 is 7 × 8!',
  m6x8: 'Six and eight went out to skate, and came home at forty-eight!',
  m8x8: 'Eight times eight, the unicorns ate sixty-four cupcakes off a plate!',
  m6x7: 'Six and seven flew into the blue, and landed on forty-two!',
  m7x7: 'Seven sevens dancing in a line: forty-nine!',
  m6x6: "Six times six, a pony's tricks: thirty-six!",
};

export function rhymeFor(item) {
  return RHYMES[item.family] || null;
}

export function trickFor(item) {
  return item.kind === 'mul' ? mulTrick(item) : divTrick(item);
}

const grid = (rows, cols, parts = [rows], labels = [], fade = false) => ({ kind: 'array', rows, cols, parts, labels, fade });

function mulTrick({ teach: f, other: n, answer: p }) {
  const two = 2 * n;
  const five = 5 * n;
  const ten = 10 * n;
  switch (f) {
    case 0:
      return { name: 'The ×0 rule', steps: [`0 groups of ${n} is nothing at all.`, 'So the answer is 0.'], picture: { kind: 'empty' } };
    case 1:
      return { name: 'The ×1 rule', steps: [`1 group of ${n} is just ${n}.`], picture: grid(1, n, [1], [n]) };
    case 10:
      return { name: 'The ×10 rule', steps: [`10 groups of ${n} make ${n} tens.`, `Put a zero on the end: ${n} → ${p}.`],
        picture: grid(10, n, [10], [p]) };
    case 2:
      return { name: 'Double it!', steps: [`Double ${n}:`, `${n} + ${n} = ${p}`], picture: grid(2, n, [1, 1], [n, n]) };
    case 5:
      return { name: 'Half of ten', steps: ['5 is half of 10.', `10 × ${n} = ${ten}, and half of ${ten} is ${p}.`],
        picture: grid(10, n, [5, 5], [p, ''], true) };
    case 9: {
      const check = p >= 10 ? [`Check: ${Math.floor(p / 10)} + ${p % 10} = 9 ✨`] : [];
      return { name: 'Ten, take one away', steps: [`Make 10 groups, then take one group away.`, `10 × ${n} = ${ten}`, `${ten} − ${n} = ${p}`, ...check],
        picture: grid(10, n, [9, 1], [p, `−${n}`], true) };
    }
    case 4:
      return { name: 'Double, double', steps: ['Double it, then double again.', `${n} + ${n} = ${two}`, `${two} + ${two} = ${p}`],
        picture: grid(4, n, [2, 2], [two, two]) };
    case 3:
      return { name: 'Double plus one more', steps: ['Double it, then add one more group.', `2 × ${n} = ${two}`, `${two} + ${n} = ${p}`],
        picture: grid(3, n, [2, 1], [two, n]) };
    case 6:
      return { name: 'Five plus one more', steps: ['5 groups, plus one more group.', `5 × ${n} = ${five}`, `${five} + ${n} = ${p}`],
        picture: grid(6, n, [5, 1], [five, n]) };
    case 8:
      return { name: 'Double, double, double', steps: ['Double it three times!', `${n} → ${two} → ${4 * n} → ${p}`],
        picture: grid(8, n, [4, 4], [4 * n, 4 * n]) };
    case 7:
      return { name: 'Five plus two', steps: ['5 groups plus 2 groups.', `5 × ${n} = ${five}`, `2 × ${n} = ${two}`, `${five} + ${two} = ${p}`],
        picture: grid(7, n, [5, 2], [five, two]) };
    default:
      return { name: 'Groups', steps: [`${f} groups of ${n} make ${p}.`], picture: grid(f, n) };
  }
}

function divTrick({ p, d, answer: q }) {
  if (p === 0) {
    return { name: 'Sharing nothing', steps: [`0 treats shared by ${d} unicorns…`, 'everyone gets 0.'], picture: { kind: 'empty' } };
  }
  if (d === 1) {
    return { name: 'Sharing with one', steps: [`${p} treats for just 1 unicorn:`, `that unicorn gets all ${p}!`], picture: grid(1, p, [1], [p]) };
  }
  if (q === 1) {
    return { name: 'One each', steps: [`${p} treats shared by ${p} unicorns:`, '1 treat each!'], picture: grid(p, 1, [p], ['1 each']) };
  }
  if (d === 10) {
    return { name: 'Take the zero off', steps: [`Take the zero off: ${p} → ${q}.`, `Check: 10 × ${q} = ${p}`], picture: grid(10, q, [10], [`${q} each`]) };
  }
  return { name: 'Reverse spell', steps: [`Think: ${d} × ? = ${p}`, `${d} × ${q} = ${p}`, `So ${p} ÷ ${d} = ${q}`],
    picture: grid(d, q, [d], [`${q} each`]) };
}

export const RULE_LESSONS = {
  x1: { title: 'Magic rule: ×1', lines: ['One group of something is just that thing!', '1 × 7 = 7', 'Anything × 1 stays the same.'],
    picture: grid(1, 7, [1], [7]) },
  x10: { title: 'Magic rule: ×10', lines: ['10 groups of 3 make 30.', 'Just put a zero on the end!', '10 × 6 = 60'],
    picture: grid(10, 3, [10], [30]) },
  x0: { title: 'Magic rule: ×0', lines: ['Zero groups of anything is… nothing!', '0 × 8 = 0', 'Anything × 0 is 0.'],
    picture: { kind: 'empty' } },
  div1: { title: 'Reverse spells: ÷', lines: ['Division is multiplication backwards. It\'s sharing!', '6 ÷ 1 = 6: one unicorn gets all 6 treats.', '6 ÷ 6 = 1: six unicorns get 1 treat each.'],
    picture: grid(1, 6, [1], [6]) },
  div10: { title: 'Reverse spells: ÷10', lines: ['70 ÷ 10 = 7: take the zero off!', '70 ÷ 7 = 10, because 7 × 10 = 70.'],
    picture: grid(10, 7, [10], ['7 each']) },
  div0: { title: 'Reverse spells: sharing 0', lines: ['0 treats shared by 5 unicorns…', 'everyone gets 0.', '0 ÷ 5 = 0'],
    picture: { kind: 'empty' } },
};
