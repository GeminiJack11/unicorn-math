// Saves the event log in IndexedDB on this device. If storage isn't available (or for
// ?mem=1 test runs) everything lives in memory instead, so the game still works.
import { makeEvent, mergeLogs, newDeviceId, isEvent } from '../engine/log.js';

const DB_NAME = 'unicorn-math';

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('events', { keyPath: 'id' });
      req.result.createObjectStore('meta');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Storage is busy in another tab'));
  });
}

export async function openStore({ memory = false } = {}) {
  let db = null;
  if (!memory && globalThis.indexedDB) {
    try {
      db = await openDb();
    } catch (err) {
      console.warn('Playing without saving:', err);
    }
  }
  let events = [];
  let dev = null;
  if (db) {
    const tx = db.transaction(['events', 'meta'], 'readonly');
    [events, dev] = await Promise.all([
      request(tx.objectStore('events').getAll()),
      request(tx.objectStore('meta').get('device')),
    ]);
  }

  function write(storeName, values, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const os = tx.objectStore(storeName);
      if (key !== undefined) os.put(values, key);
      else for (const v of [].concat(values)) os.put(v);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  if (!dev) {
    dev = newDeviceId();
    if (db) write('meta', dev, 'device').catch(() => {});
  }
  events = mergeLogs(events);
  let lastT = events.length ? events[events.length - 1].t : 0;

  const store = {
    dev,
    events,
    saving: !!db,
    failed: false,
    append(type, data) {
      const t = Math.max(Date.now(), lastT + 1);
      lastT = t;
      const ev = makeEvent(dev, t, type, data);
      events.push(ev);
      if (db) {
        write('events', ev).catch((err) => {
          store.failed = true;
          console.warn('Could not save', err);
        });
      }
      return ev;
    },
    // Adds events from a backup or another device. Merging never loses anything.
    async merge(list) {
      const known = new Set(events.map((e) => e.id));
      const fresh = list.filter((e) => isEvent(e) && !known.has(e.id));
      if (!fresh.length) return 0;
      const merged = mergeLogs(events, fresh);
      events.length = 0;
      for (const e of merged) events.push(e);
      lastT = Math.max(lastT, events[events.length - 1].t);
      if (db) await write('events', fresh);
      return fresh.length;
    },
    backup() {
      return JSON.stringify({ app: 'unicorn-math', version: 1, saved: new Date().toISOString(), events });
    },
    async clear() {
      events.length = 0;
      if (!db) return;
      await new Promise((resolve, reject) => {
        const tx = db.transaction('events', 'readwrite');
        tx.objectStore('events').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
    // Asks the browser not to clear our storage when space runs low.
    async persist() {
      try {
        return (await navigator.storage?.persisted?.()) || (await navigator.storage?.persist?.()) || false;
      } catch {
        return false;
      }
    },
  };
  return store;
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data?.events;
  if (!Array.isArray(list)) throw new Error('This file is not a game backup.');
  return list.filter(isEvent);
}
