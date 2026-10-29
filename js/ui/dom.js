// Tiny helpers for building screens without a framework.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Wraps SVG markup made by our own art code (never text someone typed) in an element.
export function art(markup, cls = 'art') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = markup;
  return el;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function modal({ title, body, actions = [], cls = '' }) {
  const close = () => wrap.remove();
  const buttons = actions.map(([label, fn, c]) =>
    h('button', { class: c || 'btn', type: 'button', onClick: () => { if (fn?.() !== false) close(); } }, label));
  const wrap = h('div', { class: 'modal-wrap', onClick: (e) => { if (e.target === wrap) close(); } },
    h('div', { class: `modal ${cls}`, role: 'dialog', 'aria-modal': 'true' },
      title ? h('h2', {}, title) : null, body, h('div', { class: 'modal-actions' }, buttons)));
  document.body.append(wrap);
  buttons.at(-1)?.focus();
  return close;
}

export function toast(text, ms = 2400) {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

const S = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONS = {
  home: S('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  map: S('<path d="M3 6.5 9 4l6 2.5 6-2.5v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>'),
  window: S('<path d="M5 21V10a7 7 0 0 1 14 0v11z"/><path d="M12 3v18M5 13h14"/>'),
  wand: S('<path d="M4 20 14 10"/><path d="m15 3 1.1 2.4L18.5 6.5l-2.4 1.1L15 10l-1.1-2.4-2.4-1.1 2.4-1.1z" fill="currentColor"/><path d="m19.5 12 .6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="currentColor"/>'),
  sound: S('<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  mute: S('<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z" fill="currentColor"/></svg>',
  back: S('<path d="M15 5 8 12l7 7"/>'),
  book: S('<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/>'),
  basket: S('<path d="M3.5 10h17l-1.9 9.1a1.6 1.6 0 0 1-1.6 1.3H7a1.6 1.6 0 0 1-1.6-1.3z"/><path d="m8 10 4-6 4 6"/><path d="M9 13.5v3.5M12 13.5v3.5M15 13.5v3.5"/>'),
  close: S('<path d="M6 6l12 12M18 6 6 18"/>'),
  lock: S('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  check: S('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  backspace: S('<path d="M8.5 5H20v14H8.5L3 12z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/>'),
  print: S('<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14.5h10V21H7z"/>'),
};

export function icon(name, cls = 'icon') {
  return art(ICONS[name], cls);
}
