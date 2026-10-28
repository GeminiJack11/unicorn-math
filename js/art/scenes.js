// Backgrounds she can put behind her unicorn. Each is a 300 × 300 picture that lines up
// with the unicorn's own drawing (the ground is at y = 290), drawn as a separate layer so
// it stays still while she bobs and hops.
import { unicornSVG, star, heart } from './unicorn.js';
import { resolveLook } from './catalog.js';

let uid = 0;
const O = '#4b3366';

const cloud = (x, y, s, fill = '#ffffff') => `<path d="M${x} ${y} q0 -${14 * s} ${14 * s} -${12 * s} q${4 * s} -${10 * s} ${16 * s} -${6 * s} q${12 * s} 0 ${10 * s} ${12 * s} q${6 * s} ${6 * s} -${2 * s} ${12 * s} h-${32 * s} q-${8 * s} 0 -${6 * s} -${6 * s}z" fill="${fill}"/>`;
const flower = (x, y, c) => `<g>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + 4 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" cy="${(y + 4 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" r="3.4" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y}" r="2.6" fill="#ffe066"/></g>`;
const twinkle = (x, y, r, fill) => `<path d="${star(x, y, r, 4, 0.35)}" fill="${fill}"/>`;

const SCENES = {
  meadow: (id) => `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#fff4e0"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#${id}-sky)"/>
    <circle cx="246" cy="58" r="26" fill="#ffe27a"/><circle cx="246" cy="58" r="36" fill="#ffe27a" opacity="0.3"/>
    ${cloud(30, 70, 1.3)}${cloud(150, 44, 0.9)}
    <path d="M0 200 Q70 150 150 190 T300 180 V300 H0Z" fill="#a8e6a1"/>
    <path d="M0 240 Q90 205 180 235 T300 225 V300 H0Z" fill="#7fd48a"/>
    ${[[24, 256, '#ff8fc8'], [62, 276, '#b98bff'], [262, 252, '#7cc8ff'], [236, 280, '#ff8fc8'], [120, 222, '#ffffff'], [204, 230, '#b98bff'], [282, 274, '#ffffff']].map(([x, y, c]) => flower(x, y, c)).join('')}`,

  beach: (id) => `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#e6f8ff"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#${id}-sky)"/>
    <circle cx="60" cy="62" r="24" fill="#ffd45e"/>
    ${cloud(170, 60, 1.1)}
    <rect y="168" width="300" height="60" fill="#3fb6e8"/>
    <path d="M0 176 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#bdeeff" stroke-width="4" stroke-linecap="round"/>
    <path d="M0 200 q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#9fe3ff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M0 218 Q150 200 300 222 V300 H0Z" fill="#ffe2a8"/>
    <path d="M0 218 Q150 200 300 222" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
    <path d="M262 290 Q270 200 252 128" fill="none" stroke="#b8865a" stroke-width="9" stroke-linecap="round"/>
    ${[[-150, '#4fbf6a'], [-110, '#62cf78'], [-70, '#4fbf6a'], [-20, '#62cf78'], [-200, '#62cf78']].map(([a, c]) => `<path d="M252 128 q${(40 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(40 * Math.sin((a * Math.PI) / 180) - 8).toFixed(1)} ${(58 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(58 * Math.sin((a * Math.PI) / 180) + 22).toFixed(1)}" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`).join('')}
    <circle cx="246" cy="134" r="6" fill="#8a5a3c"/><circle cx="257" cy="136" r="6" fill="#8a5a3c"/>
    <path d="${star(34, 268, 10, 5, 0.45)}" fill="#ff9a6b"/>
    <path d="M206 276 a9 9 0 0 1 18 0 z" fill="#ffc6de"/><path d="M215 276 v-8 M210 276 l3 -7 M220 276 l-3 -7" stroke="#ff9cc9" stroke-width="1.5"/>`,

  sea: (id) => `<defs><linearGradient id="${id}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd0f5"/><stop offset="1" stop-color="#2f7fd0"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#${id}-sea)"/>
    ${[[30, 0, 70], [110, 0, 60], [200, 0, 80]].map(([x, , w]) => `<path d="M${x} 0 l${w / 2} 170 l${w / 2} -170z" fill="#ffffff" opacity="0.12"/>`).join('')}
    <path d="M0 252 Q80 238 160 250 T300 246 V300 H0Z" fill="#f4dca0"/>
    ${[[22, 1], [44, -1], [272, 1], [252, -1]].map(([x, d]) => `<path d="M${x} 296 q${12 * d} -20 0 -40 q${-12 * d} -20 0 -40 q${10 * d} -16 2 -30" fill="none" stroke="#3fae6a" stroke-width="8" stroke-linecap="round"/>`).join('')}
    <path d="M214 296 q-4 -24 -16 -30 m16 30 q2 -28 12 -36 m-12 36 q8 -14 22 -16" fill="none" stroke="#ff7eb6" stroke-width="7" stroke-linecap="round"/>
    ${[[80, 60, 7], [94, 40, 5], [86, 22, 3.5], [226, 96, 6], [236, 74, 4], [150, 30, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#e8fbff" stroke-width="2" opacity="0.85"/>`).join('')}
    ${[[50, 120, '#ffd45e', 1], [250, 160, '#ff9a6b', -1]].map(([x, y, c, d]) => `<g transform="translate(${x} ${y}) scale(${d} 1)"><path d="M-12 0 q12 -12 24 0 q-12 12 -24 0z" fill="${c}"/><path d="M-12 0 l-9 -7 v14z" fill="${c}"/><circle cx="6" cy="-2" r="2" fill="${O}"/></g>`).join('')}
    <path d="${star(130, 272, 10, 5, 0.45)}" fill="#ffb3d9"/>`,

  night: (id) => `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#5b4aa8"/></linearGradient>
    <radialGradient id="${id}-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>
    <rect width="300" height="300" fill="url(#${id}-sky)"/>
    <circle cx="240" cy="60" r="30" fill="#fff6c9"/><circle cx="254" cy="50" r="27" fill="#2a2560"/>
    ${[[30, 30, 6], [80, 70, 4], [130, 24, 5], [180, 90, 3.5], [40, 130, 4], [280, 130, 5], [110, 120, 3], [200, 30, 3.5], [20, 200, 3], [290, 210, 3.5]].map(([x, y, r], i) => twinkle(x, y, r * 1.4, i % 3 ? '#fff6c9' : '#ffd1ec')).join('')}
    <ellipse cx="150" cy="200" rx="150" ry="110" fill="url(#${id}-glow)"/>
    <path d="M0 236 Q60 214 130 232 T300 226 V300 H0Z" fill="#3b3478"/>
    <path d="M0 262 Q100 246 200 262 T300 258 V300 H0Z" fill="#2c2766"/>`,

  castle: (id) => `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc4e4"/><stop offset="1" stop-color="#fff0d9"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#${id}-sky)"/>
    ${['#ff6b8b', '#ffa35c', '#ffd84d', '#6fdc8c', '#5cc0ff', '#b67bff'].map((c, i) => `<path d="M${125 + i * 7} 230 A${140 - i * 7} ${140 - i * 7} 0 0 1 ${405 - i * 7} 230" fill="none" stroke="${c}" stroke-width="7" opacity="0.5"/>`).join('')}
    ${cloud(232, 92, 0.9)}
    <g fill="#efe4ff" stroke="#b9a2e8" stroke-width="3" stroke-linejoin="round">
      <rect x="22" y="110" width="96" height="120"/>
      <rect x="12" y="82" width="30" height="148"/><rect x="98" y="82" width="30" height="148"/>
      <rect x="51" y="58" width="38" height="172"/>
    </g>
    <g fill="#ff8fc8" stroke="#b9a2e8" stroke-width="3" stroke-linejoin="round">
      <path d="M8 84 L27 46 L46 84Z"/><path d="M94 84 L113 46 L132 84Z"/><path d="M47 60 L70 16 L93 60Z"/>
    </g>
    <path d="M70 16 v-12 l14 5 l-14 5" fill="#ffd34d" stroke="#b9a2e8" stroke-width="2"/>
    ${[[27, 104], [113, 104], [70, 84], [70, 130]].map(([x, y]) => `<path d="M${x - 5} ${y + 12} v-8 a5 5 0 0 1 10 0 v8z" fill="#b18cff"/>`).join('')}
    <path d="M55 230 v-34 a15 15 0 0 1 30 0 v34z" fill="#b18cff"/>
    <path d="${heart(70, 176, 6)}" fill="#ff6fae"/>
    <path d="M0 226 Q150 206 300 228 V300 H0Z" fill="#b8eab0"/>
    ${[[30, 262, '#ff8fc8'], [150, 276, '#ffffff'], [200, 246, '#b98bff'], [280, 270, '#ff8fc8'], [256, 236, '#ffffff']].map(([x, y, c]) => flower(x, y, c)).join('')}`,
};

export function sceneSVG(kind, { cls = '' } = {}) {
  const draw = SCENES[kind];
  if (!draw) return '';
  const id = `sc${++uid}`;
  return `<svg class="scene ${cls}" viewBox="0 0 300 300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="${id}-clip"><rect width="300" height="300" rx="34"/></clipPath></defs>
    <g clip-path="url(#${id}-clip)">${draw(id)}</g></svg>`;
}

// Her unicorn standing in front of the scene she picked, if she has picked one.
export function petSceneSVG(look, opts) {
  return sceneSVG(resolveLook(look).scene) + unicornSVG(look, opts);
}
