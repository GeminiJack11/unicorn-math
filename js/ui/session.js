// A quest: lessons, questions, hints and celebrations, stepped through by the engine's
// SessionRunner. Every answer is logged before moving on, so nothing is lost if she leaves.
import { h, art, icon, modal } from './dom.js';
import { createKeypad } from './keypad.js';
import { burstAt, flyTo } from './fx.js';
import { pictureSVG, triangleSVG } from './visuals.js';
import { snapshot } from './progress.js';
import { unicornSVG } from '../art/unicorn.js';
import { friendSVG } from '../art/friends.js';
import { sfx } from '../audio/sfx.js';
import { planSession, SessionRunner, fluencyLimit } from '../engine/schedule.js';
import { questionParts } from '../engine/facts.js';
import { trickFor, rhymeFor, RULE_LESSONS } from '../engine/tricks.js';
import { growth, stardust } from '../engine/model.js';

const PRAISE = ['Sparkly!', 'Magical!', 'You got it!', 'Wonderful!', 'Yes!', 'Brilliant!', 'Shiny!', 'Hooray!'];
export const QUEST_LENGTHS = { short: 14, normal: 20, long: 28 };

export function sessionScreen(app, { focus = null } = {}) {
  const m = app.model;
  const cat = app.catalog;
  const plan = planSession(m, { length: QUEST_LENGTHS[m.settings.length] || QUEST_LENGTHS.normal, focus });
  const run = new SessionRunner(m, plan);
  const limit = fluencyLimit(m);
  const sid = Date.now().toString(36);
  const startedAt = Date.now();
  const before = snapshot(m);
  let ended = false;
  let timer = null;
  let right = 0;
  app.log('session', { phase: 'start', s: sid, focus });

  const keypad = createKeypad();
  const dustCount = h('span', {}, String(stardust(m)));
  const dust = h('div', { class: 'dust-pill', 'aria-label': 'stardust' }, icon('star', 'icon dust-icon'), dustCount);
  const fill = h('div', { class: 'progress-fill' });
  const pet = h('div', { class: 'pet' });
  const stage = h('div', { class: 'stage' });
  const el = h('div', { class: 'screen session' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Leave quest', onClick: leave }, icon('close')),
      h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'quest progress' }, fill),
      dust),
    h('main', { class: 'session-body' }, pet, stage, h('div', { class: 'pad-wrap' }, keypad.el)));

  const g = growth(m);
  const drawPet = (mood = 'happy') => {
    pet.innerHTML = unicornSVG(m.look, { age: g.age, wings: g.wings, mood });
  };
  drawPet();

  function show() {
    clearTimeout(timer);
    fill.style.width = `${Math.round(run.progress() * 100)}%`;
    const card = run.card;
    if (!card) return finish();
    stage.replaceChildren();
    keypad.bind(null);
    el.classList.toggle('no-pad', card.type === 'lesson' || card.type === 'island');
    if (card.type === 'island') return showIsland(card);
    if (card.type === 'lesson') return showLesson(card);
    return showQuestion(card);
  }

  function next(result) {
    run.next(result);
    show();
  }

  // On cards without a question, Enter (or the hidden pad's ✓) just continues.
  function enterContinues(fn) {
    keypad.setEnabled(true);
    keypad.bind({ enter: fn });
  }

  function showIsland(card) {
    const isl = cat.islands[card.island];
    sfx.sparkle();
    stage.append(h('div', { class: 'card island-card pop-in' },
      art(friendSVG(isl.id), 'friend-art'),
      h('h2', {}, `Welcome to ${isl.name}!`),
      h('p', { class: 'big-line' }, isl.why),
      h('p', { class: 'line' }, `Let's see which ${isl.table} spells you already know. If one is new, tap "Teach me" and we'll learn it together.`),
      h('button', { class: 'btn primary big', type: 'button', onClick: () => next() }, "Let's go!")));
    enterContinues(() => next());
  }

  function showLesson(card) {
    const lesson = cat.lessonById.get(card.lesson);
    const body = h('div', { class: 'card lesson-card pop-in' });
    if (lesson.kind === 'rule') {
      app.log('intro', { lesson: lesson.id, items: lesson.items });
      const info = RULE_LESSONS[lesson.topic];
      body.append(h('div', { class: 'tag' }, 'Magic rule'), h('h2', {}, info.title),
        h('div', { class: 'lesson-grid' }, art(pictureSVG(info.picture), 'picture-wrap'),
          h('div', { class: 'steps' }, info.lines.map((t, i) => h('p', { class: i ? 'line' : 'big-line' }, t)))));
    } else if (lesson.kind === 'family') {
      const item = cat.items.get(lesson.family);
      const trick = trickFor(item);
      const rhyme = rhymeFor(item);
      const { teach: f, other: n, answer: p } = item;
      body.append(h('div', { class: 'tag' }, 'New spell'), h('h2', { class: 'fact-title' }, `${f} × ${n} = ${p}`),
        h('div', { class: 'lesson-grid' }, art(pictureSVG(trick.picture), 'picture-wrap'),
          h('div', { class: 'steps' }, h('h3', {}, `Unicorn Trick: ${trick.name}`), trick.steps.map((s) => h('p', {}, s)),
            rhyme ? h('p', { class: 'rhyme' }, rhyme) : null,
            f !== n ? h('p', { class: 'line' }, `Turn-around: ${n} × ${f} = ${p} too!`) : null)));
    } else {
      const fam = cat.items.get(lesson.family);
      const divs = (card.focus || lesson.items).map((id) => cat.items.get(id));
      const d0 = divs[0];
      body.append(h('div', { class: 'tag' }, 'Reverse spell'), h('h2', {}, 'Division undoes multiplication'),
        h('div', { class: 'lesson-grid' }, art(triangleSVG(fam.a, fam.b, fam.answer), 'picture-wrap tri'),
          h('div', { class: 'steps' }, h('p', { class: 'big-line' }, `${fam.a} × ${fam.b} = ${fam.answer}`),
            divs.map((d) => h('p', { class: 'big-line' }, `so ${d.p} ÷ ${d.d} = ${d.answer}`)),
            h('p', { class: 'line' }, `${d0.p} treats shared by ${d0.d} unicorns: ${d0.answer} each!`))));
    }
    body.append(h('button', { class: 'btn primary big', type: 'button', onClick: () => next() }, lesson.kind === 'rule' ? 'Got it!' : 'Try it!'));
    stage.append(body);
    enterContinues(() => next());
  }

  function showQuestion(card) {
    const item = cat.items.get(card.item);
    const parts = questionParts(item, card.flip);
    const probe = card.type === 'probe';
    let typed = '';
    let locked = false;
    const answer = h('span', { class: 'answer' }, '?');
    const notes = { lesson: 'Your turn!', repeat: 'This one again!' };
    const note = probe ? 'New spell! Do you know it already?' : notes[card.ctx];
    const box = h('div', { class: 'card q-card pop-in' },
      note ? h('div', { class: 'q-note' }, note) : null,
      h('div', { class: 'problem' }, h('span', {}, parts.left), h('span', { class: 'op' }, parts.op),
        h('span', {}, parts.right), h('span', { class: 'eq' }, '='), answer),
      probe ? h('button', { class: 'btn soft', type: 'button', onClick: () => !locked && submit(true) }, 'Teach me') : null);
    stage.append(box);
    const t0 = performance.now();
    keypad.setEnabled(true);
    keypad.bind({
      digit(d) {
        if (locked || typed.length >= 3) return;
        typed = typed === '0' ? d : typed + d;
        render();
      },
      back() {
        if (locked) return;
        typed = typed.slice(0, -1);
        render();
      },
      enter() {
        if (!locked && typed !== '') submit(false);
      },
    });

    function render() {
      answer.textContent = typed || '?';
      answer.classList.toggle('typed', typed !== '');
    }

    function submit(skip) {
      locked = true;
      keypad.setEnabled(false);
      const ms = Math.round(performance.now() - t0);
      const given = skip ? null : Number(typed);
      const ok = !skip && given === parts.answer;
      const fluent = ok && ms <= limit;
      if (ok) right++;
      app.log('answer', { item: item.id, ctx: probe ? 'probe' : card.ctx, ok, fluent, ms, given, s: sid, ...(skip ? { skip: true } : {}) });
      if (ok) celebrate(box, answer, probe && fluent, () => next({ ok, fluent }));
      else if (probe) newSpell(parts, skip, () => next({ ok: false }));
      else hint(item, parts, () => next({ ok: false }));
    }
  }

  function celebrate(box, answer, knewIt, done) {
    box.classList.add('right');
    sfx.correct();
    burstAt(answer);
    drawPet('joy');
    pet.classList.remove('hop');
    void pet.offsetWidth;
    pet.classList.add('hop');
    box.append(h('div', { class: 'praise' }, knewIt ? 'You already knew it!' : PRAISE[Math.floor(Math.random() * PRAISE.length)]));
    flyTo(answer, dust, () => {
      dustCount.textContent = String(stardust(app.model));
      dust.classList.remove('bump');
      void dust.offsetWidth;
      dust.classList.add('bump');
    });
    timer = setTimeout(() => {
      drawPet();
      done();
    }, knewIt ? 1100 : 850);
  }

  function newSpell(parts, skip, done) {
    sfx.pop();
    el.classList.add('no-pad');
    stage.replaceChildren(h('div', { class: 'card q-card pop-in' },
      h('div', { class: 'q-note' }, skip ? "Let's learn this one!" : "That's a new one for you. We'll learn it!"),
      h('div', { class: 'problem small' }, `${parts.left} ${parts.op} ${parts.right} = ${parts.answer}`),
      h('button', { class: 'btn primary big', type: 'button', onClick: done }, 'OK!')));
    enterContinues(done);
  }

  // A gentle second look: the picture and the trick, then she types the answer to go on.
  function hint(item, parts, done) {
    sfx.oops();
    const trick = trickFor(item);
    const rhyme = rhymeFor(item);
    let typed = '';
    const answer = h('span', { class: 'answer' }, '?');
    const flipped = item.kind === 'mul' && item.teach !== item.other && parts.left !== item.teach;
    stage.replaceChildren(h('div', { class: 'card hint-card pop-in' },
      h('div', { class: 'tag' }, 'Unicorn Trick'),
      h('h3', {}, "Let's look at this one together"),
      h('div', { class: 'lesson-grid' }, art(pictureSVG(trick.picture), 'picture-wrap'),
        h('div', { class: 'steps' },
          flipped ? h('p', { class: 'line' }, `${parts.left} × ${parts.right} is the same as ${item.teach} × ${item.other}.`) : null,
          trick.steps.map((s) => h('p', {}, s)), rhyme ? h('p', { class: 'rhyme' }, rhyme) : null)),
      h('div', { class: 'problem small' }, h('span', {}, parts.left), h('span', { class: 'op' }, parts.op),
        h('span', {}, parts.right), h('span', { class: 'eq' }, '='), answer),
      h('p', { class: 'q-note' }, `Type ${parts.answer} to keep going`)));
    keypad.setEnabled(true);
    keypad.bind({
      digit(d) {
        if (typed.length >= 3) return;
        typed += d;
        answer.textContent = typed;
        if (Number(typed) === parts.answer) {
          keypad.setEnabled(false);
          answer.classList.add('typed');
          sfx.sparkle();
          burstAt(answer, { count: 8 });
          timer = setTimeout(done, 700);
        } else if (typed.length >= String(parts.answer).length) {
          answer.classList.add('shake');
          setTimeout(() => {
            typed = '';
            answer.textContent = '?';
            answer.classList.remove('shake');
          }, 450);
        }
      },
      back() {
        typed = typed.slice(0, -1);
        answer.textContent = typed || '?';
      },
      enter() {},
    });
  }

  function end(done) {
    if (ended) return;
    ended = true;
    clearTimeout(timer);
    app.log('session', { phase: 'end', s: sid, done, ms: Date.now() - startedAt });
  }

  function finish() {
    end(true);
    sfx.fanfare();
    app.go('results', { before, answered: run.answered, right });
  }

  function leave() {
    modal({
      title: 'Leave this quest?',
      body: h('p', {}, 'Everything you answered is saved.'),
      actions: [['Keep playing', null, 'btn soft'], ['Leave', () => { end(false); app.go('home'); }, 'btn primary']],
    });
  }

  const onHide = () => end(false);
  window.addEventListener('pagehide', onHide);
  show();
  return {
    el,
    destroy() {
      clearTimeout(timer);
      keypad.destroy();
      window.removeEventListener('pagehide', onHide);
    },
  };
}
