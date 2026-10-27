// The save file is an append-only log of events. Every event carries the id of the
// device that made it, so logs from two devices can later be merged by plain union.

export function localDay(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + n).getTime());
}

export function daysBetween(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Event ids are time + device, so they are unique as long as each device's clock only moves
// forward (the store guarantees that).
export function makeEvent(dev, t, type, data = {}) {
  return { ...data, id: `${t.toString(36)}.${dev}`, t, dev, type };
}

export function compareEvents(x, y) {
  return x.t - y.t || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
}

// Union of any number of logs, deduplicated by id, in canonical order.
export function mergeLogs(...logs) {
  const byId = new Map();
  for (const log of logs) for (const ev of log) if (isEvent(ev)) byId.set(ev.id, ev);
  return [...byId.values()].sort(compareEvents);
}

export function isEvent(ev) {
  return !!ev && typeof ev.id === 'string' && Number.isFinite(ev.t) && typeof ev.type === 'string';
}

export function newDeviceId() {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}
