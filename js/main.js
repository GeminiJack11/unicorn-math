// Starts the game: loads the saved log, folds it into progress, and shows the right screen.
import { buildCatalog } from './engine/facts.js';
import { fold, applyEvent } from './engine/model.js';
import { openStore } from './store/db.js';
import { sfx } from './audio/sfx.js';
import { homeScreen } from './ui/home.js';
import { hatchScreen } from './ui/hatch.js';
import { sessionScreen } from './ui/session.js';
import { resultsScreen } from './ui/results.js';
import { mapScreen } from './ui/map.js';
import { windowScreen } from './ui/window.js';
import { boutiqueScreen } from './ui/designer.js';
import { grownupsScreen } from './ui/grownups.js';

const SCREENS = {
  home: homeScreen, hatch: hatchScreen, session: sessionScreen, results: resultsScreen,
  map: mapScreen, window: windowScreen, boutique: boutiqueScreen, grownups: grownupsScreen,
};
const params = new URLSearchParams(location.search);

function applySettings(app) {
  const s = app.model.settings;
  sfx.setMuted(s.sound === 'off');
  const calm = s.motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('calm', calm);
  document.title = s.title || 'Rainbow Isles';
}

async function boot() {
  const catalog = buildCatalog();
  const debug = params.get('debug');
  const store = await openStore({ memory: params.has('mem') || !!debug });
  if (debug) {
    const { seedDebug } = await import('./debug.js');
    await seedDebug(store, catalog, debug);
  }
  const root = document.getElementById('app');
  const app = {
    catalog,
    store,
    model: fold(catalog, store.events),
    screen: null,
    updateReady: false,
    log(type, data) {
      const ev = store.append(type, data);
      applyEvent(app.model, ev);
      return ev;
    },
    refold() {
      app.model = fold(catalog, store.events);
      applySettings(app);
    },
    setSetting(key, value) {
      app.log('setting', { key, value });
      applySettings(app);
    },
    go(name, opts = {}) {
      if (name === 'home' && app.updateReady) {
        location.reload();
        return;
      }
      app.screen?.destroy?.();
      document.querySelectorAll('.modal-wrap').forEach((w) => w.remove());
      document.querySelector('.fx-layer')?.replaceChildren();
      const screen = (SCREENS[name] || SCREENS.home)(app, opts);
      root.replaceChildren(screen.el);
      app.screen = screen;
      window.scrollTo(0, 0);
      screen.mounted?.();
    },
  };
  applySettings(app);
  document.addEventListener('pointerdown', () => sfx.wake(), { once: true });
  store.persist();
  const start = params.get('screen');
  app.go(!app.model.name ? 'hatch' : start && SCREENS[start] ? start : 'home', start === 'grownups' ? { open: true } : {});
  window.app = debug ? app : undefined;
  registerServiceWorker(app);
}

function registerServiceWorker(app) {
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!('serviceWorker' in navigator) || (local && !params.has('sw'))) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Offline mode unavailable:', err));
  // A new version took over: reload the next time she's back on the home screen.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) app.updateReady = true;
  });
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML = '<div class="splash"><p>Oops, something went wrong. Please reload the page.</p></div>';
});
