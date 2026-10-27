// The on-screen number pad. Physical keys work too (the Chromebook keyboard), and we never
// focus a text box during play, so a tablet's own keyboard can't pop up over the game.
import { h, icon } from './dom.js';
import { sfx } from '../audio/sfx.js';

export function createKeypad() {
  let handlers = null;
  const keys = new Map();

  const flash = (k) => {
    const el = keys.get(k);
    if (!el) return;
    el.classList.remove('pressed');
    void el.offsetWidth;
    el.classList.add('pressed');
  };

  const press = (k) => {
    if (!handlers || pad.classList.contains('disabled')) return;
    sfx.tap();
    flash(k);
    if (k === 'back') handlers.back?.();
    else if (k === 'ok') handlers.enter?.();
    else handlers.digit?.(k);
  };

  const key = (k, label, cls = '') => {
    const el = h('button', {
      class: `key ${cls}`, type: 'button', 'data-key': k,
      'aria-label': k === 'back' ? 'delete' : k === 'ok' ? 'check my answer' : k,
      onPointerdown: (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        press(k);
      },
    }, label);
    keys.set(k, el);
    return el;
  };

  const pad = h('div', { class: 'keypad' },
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => key(d, d)),
    key('back', icon('backspace'), 'key-back'), key('0', '0'), key('ok', icon('check'), 'key-ok'));

  const onKey = (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.repeat) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') {
      e.preventDefault();
      press('back');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      press('ok');
    }
  };
  document.addEventListener('keydown', onKey);

  return {
    el: pad,
    bind(next) {
      handlers = next;
    },
    setEnabled(on) {
      pad.classList.toggle('disabled', !on);
    },
    destroy() {
      document.removeEventListener('keydown', onKey);
    },
  };
}
