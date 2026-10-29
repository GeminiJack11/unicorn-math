// End of a quest: what she earned and what's new, celebrated.
import { h, art, icon } from './dom.js';
import { confetti } from './fx.js';
import { changes } from './progress.js';
import { petSceneSVG } from '../art/scenes.js';
import { friendSVG } from '../art/friends.js';
import { rewardFor } from '../art/catalog.js';
import { growth } from '../engine/model.js';

function factLabel(it) {
  return it.kind === 'mul' ? `${it.a} × ${it.b} = ${it.answer}` : `${it.p} ÷ ${it.d} = ${it.answer}`;
}

export function resultsScreen(app, { before, right = 0, missed = [] }) {
  const m = app.model;
  const cat = app.catalog;
  const ch = changes(before, m);
  const g = growth(m);
  const items = (ids) => ids.map((id) => cat.items.get(id)).filter((it) => it && !it.rule);
  const newSpells = items(ch.learned);
  const mastered = items(ch.mastered);
  const masteredRules = ch.mastered.length - mastered.length;
  // One spell she missed today that has no charm yet (rules like ×0 don't need one).
  const charmIdea = missed.map((id) => cat.items.get(id)).find((f) => f && !f.rule && !m.charms.has(f.id)) || null;

  const news = [];
  for (const i of ch.cleared) {
    const next = cat.islands[i + 1];
    news.push(h('li', {}, `You finished ${cat.islands[i].name}!`, next ? ` ${next.name} is open now.` : ' You have visited every island!'));
  }
  for (const i of ch.friends) {
    const isl = cat.islands[i];
    const reward = rewardFor(isl.id);
    news.push(h('li', { class: 'friend-news' }, art(friendSVG(isl.id), 'mini-friend'),
      h('span', {}, `You befriended ${isl.friend}!`, reward ? ` Your gift: ${reward.name}, waiting in the Boutique.` : '')));
  }
  if (ch.wings) news.push(h('li', { class: 'big-news' }, 'Your unicorn earned its WINGS! You learned every spell!'));
  else if (ch.grew) news.push(h('li', { class: 'big-news' }, 'Look! Your unicorn grew!'));

  const chip = (text, cls = '') => h('span', { class: `chip ${cls}` }, text);
  const el = h('div', { class: 'screen results' },
    h('main', { class: 'results-main' },
      h('h1', { class: 'game-title' }, 'Quest complete!'),
      art(petSceneSVG(m.look, { age: g.age, wings: g.wings, mood: 'joy' }), 'hero-pet hop-loop'),
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat' }, icon('star', 'icon dust-icon'), h('b', {}, `+${ch.stardust}`), h('span', {}, 'stardust')),
        h('div', { class: 'stat' }, h('b', {}, String(right)), h('span', {}, 'right answers')),
        ch.lit > 0 ? h('div', { class: 'stat' }, h('b', {}, `+${ch.lit}`), h('span', {}, 'window panes lit')) : null),
      news.length ? h('ul', { class: 'news' }, news) : null,
      newSpells.length ? h('section', { class: 'spell-list' }, h('h3', {}, 'New spells today'), h('div', { class: 'chips' }, newSpells.map((it) => chip(factLabel(it))))) : null,
      mastered.length || masteredRules ? h('section', { class: 'spell-list' }, h('h3', {}, 'Spells you know by heart now'),
        h('div', { class: 'chips' }, mastered.map((it) => chip(factLabel(it), 'gold')),
          masteredRules ? chip(`+${masteredRules} magic-rule spells`, 'gold') : null)) : null,
      charmIdea ? h('div', { class: 'charm-nudge' },
        h('span', {}, `${charmIdea.teach} × ${charmIdea.other} was tricky today. A charm could help you remember it!`),
        h('button', { class: 'btn soft', type: 'button', onClick: () => app.go('spellbook', { family: charmIdea.id }) }, icon('book'), 'Make a charm')) : null,
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn soft big', type: 'button', onClick: () => app.go('window') }, icon('window'), 'Magic Window'),
        h('button', { class: 'btn primary big', type: 'button', onClick: () => app.go('home') }, icon('home'), 'Home'))));

  return { el, mounted: () => confetti(ch.friends.length || ch.cleared.length || ch.wings ? 90 : 50) };
}
