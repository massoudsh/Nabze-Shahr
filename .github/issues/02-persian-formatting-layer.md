> **Status:** ✅ Done — commit 90d594e

# 02 — Add a Persian formatting layer (Jalali dates, Persian digits, Toman)

<!-- labels: type:feature,area:i18n,market:iran,priority:p0 -->
<!-- agent: frontend -->

## Why (Iran market demand)

The product is sold to Iranian municipalities, but every displayed number, date
and amount is a hand-written string in `assets/js/script.js:56-133`
(`"۸۶٪ ظرفیت شبکه"`, `"۳ مورد"`). There is no Jalali calendar support, no Toman
formatting, and no single place to produce consistent Persian output. Any future
screenshot, report, contract annex or dashboard row would need manual strings,
which is where localization bugs and wrong digits appear in B2G deliverables.

Iranian buyers expect: Jalali dates (۱۴۰۵/۰۹/۰۲ style or `۲ آذر ۱۴۰۵`), Persian
digits, `٬` thousand separators, and Toman / Rial amounts with a clear unit label.

## Scope

Create `assets/js/format.js` as an ES module with pure, dependency-free helpers:

| Function | Behavior |
|---|---|
| `toPersianDigits(value)` | ASCII digits → ۰-۹, keeps other characters |
| `formatNumber(value)` | Persian digits + `٬` grouping (e.g. `۱۲٬۴۵۰`) |
| `formatToman(value)` | Number + ` تومان`, grouped, Persian digits |
| `formatPercent(value)` | Signed percentage with `+`/`−` and `٪` |
| `formatJalali(dateOrIso, style)` | `numeric` → `۱۴۰۵/۰۹/۰۲`, `long` → `۲ آذر ۱۴۰۵` |
| `formatRelative(dateOrIso, now)` | `۳ ساعت پیش`, `دیروز` |

Rules:

- Jalali conversion must be implemented locally (Gregorian ↔ Jalali algorithm);
  no CDN, no npm dependency, no `Intl` reliance for the calendar.
- Use `−` (U+2212) for negative values to match the existing design copy.
- Return `"—"` for invalid or missing input instead of throwing.
- `formatJalali` must accept `Date`, ISO strings, and epoch milliseconds.

Then refactor `script.js` so the scenario and dashboard values are produced
through these helpers rather than embedded Persian strings.

## Acceptance criteria

- [ ] `assets/js/format.js` exports the six functions above and has no imports.
- [ ] `tests/format.test.mjs` uses `node:test` + `node:assert` and covers:
      digit conversion, grouping, negative numbers, leap-year Jalali boundary
      (۱۴۰۳/۱۲/۳۰), 1404→1405 year rollover, invalid input, and relative time
      for past and future.
- [ ] `node --test tests/format.test.mjs` passes with zero dependencies.
- [ ] `script.js` no longer contains literal Persian digits in the scenario or
      dashboard data objects; values are computed and formatted at render time.
- [ ] `index.html` loads `format.js` as a module (`type="module"`) and the page
      still works from `file://` after a hard refresh (document the limitation if
      modules are blocked on `file://`).
- [ ] No regression: the three scenario options and three dashboard periods still
      update every visible field, including the state badge classes.

## Files

- `assets/js/format.js` — new
- `assets/js/script.js` — consume the helpers
- `index.html` — module script tag
- `tests/format.test.mjs` — new
- `README.md` — short usage note

## Out of scope

- Hijri/Gregorian dual display.
- Full `Intl.NumberFormat` integration or locale negotiation.
- Backend date handling.

## Notes for the agent

Keep the public surface small and documented with JSDoc. Do not change the
Persian copy of labels — only how values are produced. If a helper needs a
timezone, default to `Asia/Tehran` and make it an explicit optional argument.
