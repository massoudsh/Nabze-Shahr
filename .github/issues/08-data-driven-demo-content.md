# 08 — Move demo content out of JavaScript into validated data files

<!-- labels: type:refactor,area:content,priority:p2 -->
<!-- agent: frontend -->

## Why (Iran market demand)

All demo content for the simulator and dashboard is hardcoded inside
`assets/js/script.js:56-133`. That means every wording change, every new pilot
city, and every sales-specific scenario requires editing application code and
re-committing logic. Iranian B2G sales cycles need localized demos — "منطقه ۶
تهران" today, "منطقه ۳ اصفهان" for the next prospect — and the current structure
makes that a developer task instead of a content task.

It is also the reason the page has no way to degrade gracefully: the values are
not data, so there is no validation layer catching a missing key before it
renders as `undefined`.

## Scope

1. Create `assets/data/scenarios.json` with the three scenarios and
   `assets/data/dashboard.json` with the three periods, preserving the current
   Persian content exactly.
2. Create `assets/data/schema.json` (or a `validate` function in
   `assets/js/data.js`) that checks:
   - required keys per entry
   - `stateClass` ∈ {`good`, `watch`} for dashboard metrics
   - exactly one entry marked as the default
3. Refactor `script.js` to load data through `loadData()`:
   - `fetch('assets/data/*.json')` when served over HTTP
   - fall back to inline defaults (or an embedded `<script type="application/json">`
     block) when `fetch` fails, e.g. on `file://`
   - render only after successful load or fallback; never render half a card
4. Add `tests/data.test.mjs` that imports the JSON files and asserts the schema
   rules with `node:test`.

## Acceptance criteria

- [ ] Both JSON files exist, parse, and contain exactly the content shown today
      (no copy changes).
- [ ] `node --test tests/data.test.mjs` passes and fails loudly if a required key
      is removed (prove it by temporarily deleting a key in a scratch copy, not in
      the committed file).
- [ ] Editing `dashboard.json` alone changes the rendered values, with no JS
      edit.
- [ ] Opening `index.html` from `file://` still renders defaults, with no
      `undefined` text and no console errors.
- [ ] No fetch is attempted when `location.protocol === 'file:'`; the fallback
      path is taken directly.
- [ ] Existing selectors and IDs (`#trafficStatus`, `#scenarioName`, …) are
      unchanged so the wiki and any external references stay valid.
- [ ] Bundle cost: page still loads with zero external requests besides the
      site's own assets.

## Files

- `assets/data/scenarios.json`, `assets/data/dashboard.json` — new
- `assets/js/script.js` — loader + render split
- `tests/data.test.mjs` — new
- `README.md` — note that demo content lives in `assets/data/`

## Out of scope

- A CMS, admin panel, or build-time content pipeline.
- Translating content to English.
- Changing the demo content itself.

## Notes for the agent

Keep the Persian strings byte-identical to the current values (including the
`−` minus sign and Persian digits) so this refactor is provably content-neutral.
List any accidental wording change in the PR description.
