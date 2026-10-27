// First visit: an egg hatches, she designs her unicorn and gives it a name.
import { h, art } from './dom.js';
import { burstAt, confetti } from './fx.js';
import { designer } from './designer.js';
import { unicornSVG } from '../art/unicorn.js';
import { DEFAULT_LOOK } from '../art/catalog.js';
import { sfx } from '../audio/sfx.js';

const CRACKS = ['M58 74 l12 8 l-7 10 l10 8', 'M104 62 l-9 11 l8 8 l-10 10', 'M30 116 l16 -7 l12 9 l16 -8 l14 7 l16 -8 l16 6'];
const IDEAS = ['Sparkle', 'Luna', 'Stardust', 'Rosie', 'Comet', 'Bubbles', 'Willow', 'Pip'];

function eggSVG(cracks) {
  const spots = [[56, 52, 10, '#ffb3d9'], [104, 88, 13, '#bfa6ff'], [62, 140, 12, '#9fe0ff'], [108, 146, 8, '#ffe08a'], [84, 34, 6, '#a6f0c6']];
  return `<svg viewBox="0 0 160 200" class="egg-svg" role="img" aria-label="a magic egg">
    <defs><linearGradient id="egg-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffafd"/><stop offset="1" stop-color="#eadfff"/></linearGradient></defs>
    <ellipse cx="80" cy="188" rx="54" ry="9" fill="#cdb8f2" opacity=".55"/>
    <path d="M80 12 C122 12 146 84 146 122 C146 162 118 184 80 184 C42 184 14 162 14 122 C14 84 38 12 80 12 Z" fill="url(#egg-g)" stroke="#6b4f99" stroke-width="5"/>
    ${spots.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
    <path d="M44 60 q6 -22 22 -32" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".8"/>
    ${CRACKS.slice(0, cracks).map((d) => `<path d="${d}" fill="none" stroke="#6b4f99" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
  </svg>`;
}

export function hatchScreen(app) {
  const el = h('div', { class: 'screen hatch' });
  let look = { ...DEFAULT_LOOK };

  function stepEgg() {
    let taps = 0;
    const egg = art(eggSVG(0), 'egg wobble');
    egg.setAttribute('role', 'button');
    egg.setAttribute('aria-label', 'Tap the egg');
    egg.addEventListener('pointerdown', () => {
      if (taps >= 3) return;
      taps++;
      sfx.crack();
      egg.innerHTML = eggSVG(taps);
      egg.classList.remove('shake');
      void egg.offsetWidth;
      egg.classList.add('shake');
      if (taps === 3) {
        sfx.fanfare();
        burstAt(egg, { count: 24, spread: 170 });
        setTimeout(stepMeet, 600);
      }
    });
    el.replaceChildren(h('main', { class: 'hatch-main' },
      h('h1', { class: 'game-title' }, 'A magic egg!'), egg,
      h('p', { class: 'big-line' }, 'Something wonderful is about to hatch. Tap the egg!')));
  }

  function stepMeet() {
    confetti(60);
    el.replaceChildren(h('main', { class: 'hatch-main' },
      h('h1', { class: 'game-title' }, "It's a baby unicorn!"),
      art(unicornSVG(look, { age: 0.15, mood: 'joy' }), 'hero-pet hop-loop'),
      h('p', { class: 'big-line' }, 'It chose you! Now you get to decide how it looks.'),
      h('button', { class: 'btn primary huge', type: 'button', onClick: stepDesign }, "Let's design!")));
  }

  function stepDesign() {
    const d = designer(app, { mode: 'hatch', onDone: (l) => { look = l; stepName(); } });
    el.replaceChildren(h('header', { class: 'topbar' }, h('h1', { class: 'screen-title' }, 'Design your unicorn'), h('div', {})),
      h('main', { class: 'boutique-main' }, d.el));
  }

  function stepName() {
    const input = h('input', { class: 'name-input', type: 'text', maxlength: '16', placeholder: 'Type a name', autocomplete: 'off', spellcheck: 'false', 'aria-label': "Your unicorn's name" });
    const finish = () => {
      const name = input.value.trim().slice(0, 16) || IDEAS[0];
      app.log('look', { look });
      app.log('name', { name });
      sfx.fanfare();
      app.go('home');
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); });
    el.replaceChildren(h('main', { class: 'hatch-main' },
      art(unicornSVG(look, { age: 0.15 }), 'hero-pet idle small'),
      h('h1', { class: 'game-title' }, 'What will you name your unicorn?'),
      input,
      h('div', { class: 'chips' }, IDEAS.map((n) => h('button', { class: 'chip pick', type: 'button', onClick: () => { input.value = n; sfx.pop(); } }, n))),
      h('button', { class: 'btn primary huge', type: 'button', onClick: finish }, "That's the one!")));
  }

  stepEgg();
  return { el };
}
