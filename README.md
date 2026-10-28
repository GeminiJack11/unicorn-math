# Rainbow Isles

A unicorn adventure for practicing the times tables (0–10) and basic division. It runs in any
modern browser, installs like an app on Chromebooks and Android tablets, and works offline.

## How it teaches

- **Only 36 facts to learn.** ×0, ×1 and ×10 are taught as rules, and 3 × 8 is the same fact as
  8 × 3. That leaves the 36 facts from 2 × 2 to 9 × 9.
- **Islands in a helpful order.** ×2, ×5, ×9, ×4, ×3, ×6, ×8, then ×7. Each island has fewer new
  facts than the one before (8, 7, 6, 5, 4, 3, 2, 1), and each comes with a "Unicorn Trick"
  (doubling, half of ten, ten-take-away-one, and so on).
- **Fact families.** Division is taught as the reverse of facts already learned (48 ÷ 6 ← 6 × 8).
- **Spaced review per fact.** Every fact is tracked on its own. A first visit to an island
  checks which facts are already known, so known facts aren't drilled. Missed facts come back a
  few questions later and again over the next days.
- **No timers on screen.** Answer time is measured quietly. A fact counts as "known by heart"
  once it's answered correctly without counting it out on three different days.
- **Rewards never disappear.** Stardust buys unicorn styles; learning every fact on an island
  befriends its animal, which brings a gift; the Magic Window lights up pane by pane.

## Privacy

There are no accounts, no ads and no tracking. Progress is saved only in the browser on the
device being used. The grown-ups page (press and hold) can download a backup and restore it on
another device; restoring merges progress rather than overwriting it.

## Running it locally

```
python -m http.server 8765
```

Then open http://localhost:8765/. Add `?debug=week` (or `fresh`, `day1`, `month`, `done`) to try
it with pretend progress that isn't saved.

## Development

- `npm test`: engine and Boutique catalog tests (Node 20+). Item ids in `js/art/catalog.js` are
  stored in saved progress, so never rename or remove one; the catalog tests check this.
- `npm run simulate -- 40 0,1,10`: how a pretend learner moves through the islands.
- `npm run stamp`: refresh the offline file list and version in `sw.js` before publishing.

The code is plain JavaScript modules with no build step. The learning engine (`js/engine`) has
no DOM code; all progress comes from an append-only event log, so logs from two devices can be
merged later without conflicts.

The Fredoka font is used under the SIL Open Font License (see `fonts/OFL.txt`).
