// Celebration effects: sparkle bursts, stardust flying to the jar, and confetti.
// "Calm motion" (or the device's reduce-motion setting) keeps them small and quick.
const COLORS = ['#ff7eb6', '#ffd84d', '#7cc8ff', '#b18cff', '#7ee0a1', '#ffb86b'];
const calm = () => document.documentElement.classList.contains('calm');
let layer = null;

function fxLayer() {
  if (!layer || !layer.isConnected) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    document.body.append(layer);
  }
  return layer;
}

export function burst(x, y, { count = 14, spread = 90 } = {}) {
  const n = calm() ? Math.min(count, 5) : count;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const dist = spread * (0.5 + Math.random() * 0.6);
    s.className = 'fx-spark';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    s.style.setProperty('--c', COLORS[i % COLORS.length]);
    s.style.setProperty('--s', `${0.6 + Math.random() * 0.8}`);
    fxLayer().append(s);
    setTimeout(() => s.remove(), 900);
  }
}

export function burstAt(el, opts) {
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, opts);
}

export function flyTo(fromEl, toEl, onArrive) {
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const s = document.createElement('div');
  s.className = 'fx-dust';
  s.style.left = `${a.left + a.width / 2}px`;
  s.style.top = `${a.top + a.height / 2}px`;
  fxLayer().append(s);
  const anim = s.animate([
    { transform: 'translate(-50%, -50%) scale(0.6)' },
    { transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy * 0.45 - 50}px)) scale(1.3)`, offset: 0.5 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.5)` },
  ], { duration: calm() ? 250 : 650, easing: 'ease-in-out', fill: 'forwards' });
  anim.onfinish = () => {
    s.remove();
    onArrive?.();
  };
}

export function confetti(count = 70) {
  const n = calm() ? 12 : count;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'fx-confetti';
    c.style.left = `${Math.random() * innerWidth}px`;
    c.style.setProperty('--c', COLORS[i % COLORS.length]);
    c.style.setProperty('--x', `${(Math.random() - 0.5) * 160}px`);
    c.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    fxLayer().append(c);
    setTimeout(() => c.remove(), 3600);
  }
}
