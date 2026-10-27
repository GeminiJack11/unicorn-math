// Soft synthesized sounds (no audio files to download). Muted from the grown-ups page.
let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, at, dur, { type = 'sine', gain = 0.1, slide = 1 } = {}) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const env = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  setMuted(v) {
    muted = !!v;
  },
  wake() {
    if (!muted) audio();
  },
  tap() {
    tone(740, 0, 0.07, { type: 'triangle', gain: 0.035 });
  },
  correct() {
    tone(1047, 0, 0.16, { type: 'triangle', gain: 0.09 });
    tone(1319, 0.07, 0.22, { type: 'triangle', gain: 0.09 });
    tone(2093, 0.14, 0.3, { gain: 0.035 });
  },
  oops() {
    tone(440, 0, 0.2, { gain: 0.05, slide: 0.84 });
    tone(370, 0.11, 0.26, { gain: 0.04, slide: 0.9 });
  },
  sparkle() {
    [1568, 1760, 2093, 2349, 2637].forEach((f, i) => tone(f, i * 0.045, 0.16, { gain: 0.035 }));
  },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, { type: 'triangle', gain: 0.08 }));
    tone(1319, 0.46, 0.55, { type: 'triangle', gain: 0.08 });
  },
  pop() {
    tone(660, 0, 0.1, { gain: 0.06, slide: 1.5 });
  },
  coin() {
    tone(1319, 0, 0.07, { type: 'square', gain: 0.02 });
    tone(1760, 0.06, 0.12, { type: 'square', gain: 0.02 });
  },
  crack() {
    if (muted) return;
    const a = audio();
    if (!a) return;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.12), a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
    const src = a.createBufferSource();
    const g = a.createGain();
    g.gain.value = 0.16;
    src.buffer = buf;
    src.connect(g).connect(a.destination);
    src.start();
  },
};
