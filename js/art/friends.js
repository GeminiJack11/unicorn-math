// The animal friend on each island, as small portraits (120 × 120).
import { unicornSVG, star } from './unicorn.js';

const O = '#4b3366';
const st = (w = 3) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x, y, r = 5.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.38}" fill="#fff"/>`;
const smile = (x, y, w = 12) => `<path d="M${x - w / 2} ${y} q${w / 2} ${w * 0.55} ${w} 0" fill="none" ${st()}/>`;
const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="3.8" fill="#ff8fc6" opacity=".6"/>`;
const svg = (inner, label) => `<svg viewBox="0 0 120 120" class="friend" role="img" aria-label="${label}">${inner}</svg>`;
const cloud = (x) => `<path d="M${x} 96 q0 -14 14 -12 q4 -10 16 -6 q12 0 10 12 q6 6 -2 12 h-32 q-8 0 -6 -6z"/>`;

const FRIENDS = {
  glade: () => unicornSVG({ coat: 'coat:snow', mane: 'mane:rainbow', horn: 'horn:gold', eye: 'eye:violet', head: 'head:daisy' },
    { crop: 'head', cls: 'friend', label: 'the Glade Unicorn' }),
  twins: () => svg(
    unicornSVG({ coat: 'coat:sky', mane: 'mane:ocean', horn: 'horn:silver', eye: 'eye:blue' }, { crop: 'head', age: 0, attrs: 'x="-3" y="14" width="74" height="74"' })
    + unicornSVG({ coat: 'coat:blush', mane: 'mane:candy', horn: 'horn:pink', eye: 'eye:pink' }, { crop: 'head', age: 0, attrs: 'x="36" y="36" width="78" height="78"' }),
    'the Twin Foals'),
  starfish: () => svg(`<path d="${star(60, 64, 50, 5, 0.5)}" fill="#ff9a6b" ${st(5)}/>
    <g fill="#ffc9a8">${[[60, 30], [90, 52], [79, 88], [41, 88], [30, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join('')}</g>
    ${eye(51, 62)}${eye(69, 62)}${cheek(44, 72)}${cheek(76, 72)}${smile(60, 74, 12)}`, 'the Starfish'),
  cat: () => svg(`<path d="M28 52 L30 16 L54 36 Z M92 52 L90 16 L66 36 Z" fill="#c9bfe6" ${st()}/>
    <path d="M33 44 L34 25 L47 37 Z M87 44 L86 25 L73 37 Z" fill="#ffb8d6"/>
    <ellipse cx="60" cy="66" rx="40" ry="35" fill="#c9bfe6" ${st()}/>
    ${eye(46, 62, 6)}${eye(74, 62, 6)}${cheek(38, 76)}${cheek(82, 76)}
    <path d="M56 72 h8 l-4 5 z" fill="#ff7aa8" ${st(2)}/>
    <path d="M60 77 q-5 6 -10 2 M60 77 q5 6 10 2" fill="none" ${st(2.5)}/>
    <path d="M14 70 h18 M15 79 l17 -4 M106 70 h-18 M105 79 l-17 -4" ${st(2)}/>`, 'the Castle Cat'),
  pony: () => unicornSVG({ coat: 'coat:cocoa', mane: 'mane:chestnut', eye: 'eye:brown', neck: 'neck:horseshoe' },
    { crop: 'head', horn: false, cls: 'friend', label: 'the Pony' }),
  sloth: () => svg(`<path d="M6 22 Q60 6 114 22" fill="none" stroke="#8a5a3c" stroke-width="9" stroke-linecap="round"/>
    <path d="M34 22 q-4 14 4 20 M86 22 q4 14 -4 20" fill="none" stroke="#b98c66" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="60" cy="70" rx="40" ry="38" fill="#b98c66" ${st()}/>
    <ellipse cx="60" cy="74" rx="31" ry="27" fill="#ecd7bd"/>
    <path d="M31 67 q9 -13 22 -2 q-7 11 -22 2z M89 67 q-9 -13 -22 -2 q7 11 22 2z" fill="#6b4a35"/>
    ${eye(45, 66, 4.5)}${eye(75, 66, 4.5)}
    <ellipse cx="60" cy="78" rx="6" ry="4" fill="#6b4a35"/>${smile(60, 86, 14)}${cheek(38, 84)}${cheek(82, 84)}`, 'the Sloth'),
  bee: () => svg(`<ellipse cx="42" cy="34" rx="16" ry="22" fill="#e3f4ff" ${st(2.5)} transform="rotate(-25 42 34)"/>
    <ellipse cx="78" cy="34" rx="16" ry="22" fill="#e3f4ff" ${st(2.5)} transform="rotate(25 78 34)"/>
    <ellipse cx="60" cy="70" rx="40" ry="34" fill="#ffd23f" ${st()}/>
    <path d="M30 52 q30 -10 60 0 M24 70 q36 -8 72 0" fill="none" stroke="#6b4a1f" stroke-width="9" stroke-linecap="round"/>
    <path d="M50 38 q-6 -20 -16 -22 M70 38 q6 -20 16 -22" fill="none" ${st(2.5)}/>
    <circle cx="34" cy="16" r="4" fill="${O}"/><circle cx="86" cy="16" r="4" fill="${O}"/>
    ${eye(48, 84, 5)}${eye(72, 84, 5)}${cheek(40, 93)}${cheek(80, 93)}${smile(60, 94, 10)}`, 'the Honeybee'),
  octopus: () => {
    const arms = [...Array(8)].map((_, i) => {
      const x = 27 + i * 9.4;
      const dir = i < 4 ? -1 : 1;
      const spread = (i < 4 ? 3.5 - i : i - 3.5) * 3;
      return `M${x} 74 C${x + dir * spread * 0.3} 96 ${x + dir * (spread + 5)} 106 ${x + dir * (spread + 8)} 94`;
    });
    return svg(`${arms.map((d) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round"/>`).join('')}
    ${arms.map((d) => `<path d="${d}" fill="none" stroke="#c9a3ff" stroke-width="6.5" stroke-linecap="round"/>`).join('')}
    <path d="M18 76 Q18 16 60 16 Q102 16 102 76 Q60 90 18 76 Z" fill="#c9a3ff" ${st()}/>
    ${eye(46, 56, 6)}${eye(74, 56, 6)}${cheek(36, 68)}${cheek(84, 68)}${smile(60, 68, 12)}
    <circle cx="44" cy="32" r="4" fill="#e6d4ff"/><circle cx="76" cy="28" r="3" fill="#e6d4ff"/>`, 'the Octopus');
  },
  rainbow: () => svg(`${['#ff6b8b', '#ffa35c', '#ffd84d', '#6fdc8c', '#5cc0ff', '#7b8cff', '#b67bff'].map((c, i) =>
    `<path d="M${14 + i * 5} 88 A${46 - i * 5} ${46 - i * 5} 0 0 1 ${106 - i * 5} 88" fill="none" stroke="${c}" stroke-width="5.5"/>`).join('')}
    <g fill="#ffffff" ${st(2.5)}>${cloud(2)}${cloud(72)}</g>
    ${eye(19, 94, 3.5)}${eye(32, 94, 3.5)}${smile(25.5, 100, 7)}${eye(89, 94, 3.5)}${eye(102, 94, 3.5)}${smile(95.5, 100, 7)}`, 'the Rainbow'),
};

export function friendSVG(islandId) {
  return (FRIENDS[islandId] || FRIENDS.glade)();
}
