// Prints how a pretend learner moves through the islands, to sanity-check pacing.
// Usage: node tools/simulate.mjs [days] [known factors, comma separated]
import { buildCatalog } from '../js/engine/facts.js';
import { simulateLearner } from '../js/engine/sim.js';
import { learningLoad, budgets } from '../js/engine/schedule.js';
import { growth } from '../js/engine/model.js';

const days = Number(process.argv[2] || 30);
const knows = (process.argv[3] || '0,1,10').split(',').map(Number);
const cat = buildCatalog();
const rows = [];
simulateLearner(cat, {
  days, knows, seed: 5, start: new Date(2026, 9, 1, 16).getTime(),
  onSession: ({ day, m, questions }) => {
    let introduced = 0;
    let mastered = 0;
    for (const s of m.items.values()) {
      if (s.introduced) introduced++;
      if (s.everMastered) mastered++;
    }
    const acc = m.recent.length ? Math.round((100 * m.recent.reduce((a, b) => a + b, 0)) / m.recent.length) : 100;
    rows.push({ day: day + 1, questions, islands: m.cleared.size, introduced, mastered, load: JSON.stringify(learningLoad(m)),
      acc: `${acc}%`, next: JSON.stringify(budgets(m)), stage: growth(m).stage });
  },
});
console.table(rows);
