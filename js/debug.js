// ?debug=<preset> fills an in-memory save with pretend progress, for testing and screenshots.
// Nothing here touches the real save on the device.
import { simulateLearner } from './engine/sim.js';
import { DEFAULT_LOOK } from './art/catalog.js';

const DAY = 86400000;
const PRESETS = {
  fresh: null,
  hatched: { days: 0 },
  day1: { days: 1 },
  week: { days: 7, knows: [0, 1, 2, 10] },
  month: { days: 30, knows: [0, 1, 2, 5, 10] },
  done: { days: 40, knows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
};

export async function seedDebug(store, catalog, name) {
  const preset = PRESETS[name];
  if (!preset) return;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { events } = simulateLearner(catalog, {
    days: preset.days, knows: preset.knows || [0, 1, 10], start: start.getTime() - preset.days * DAY,
    look: { ...DEFAULT_LOOK, coat: 'coat:lilac', mane: 'mane:candy', head: 'head:flowers' }, name: 'Sparkle', dev: 'debug1', seed: 3,
  });
  await store.merge(events);
}
