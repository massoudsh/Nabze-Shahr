# 05 — Accessibility and RTL hardening for municipal users

<!-- labels: type:bug,area:a11y,market:iran,priority:p1 -->
<!-- agent: frontend -->

## Why (Iran market demand)

Government procurement in Iran increasingly asks vendors to demonstrate basic
accessibility, and municipal staff include older users on low-contrast office
projectors. The current page has several concrete failures:

- No skip link and no visible focus treatment for most links (`outline: none` is
  set on `.scenario-option` and `.period-button` without a replacement ring).
- `aria-live="polite"` wraps the entire dashboard layout (`index.html:210`) and
  the whole impact panel (`index.html:176`), so a period change can announce a
  large block of text.
- The scenario `role="radiogroup"` does not support Arrow / Home / End keys and
  does not manage `tabindex`, so it is not a valid radio group.
- The period selector is a `role="group"` of buttons with no `aria-pressed`.
- Small muted text (`--text-subtle: #707775` on `--bg: #0b0d0f`) is roughly
  3.5:1 — below the 4.5:1 requirement for body text.
- No `prefers-reduced-motion` handling, so the `.pulse-line` draw animation runs
  for motion-sensitive users.
- The logo is decorative SVG inside a link with only text; the second logo in
  the footer duplicates the same link semantics.

## Scope

- Add a skip link to `#top` visible on focus.
- Add a global `:focus-visible` ring using the accent token; stop removing
  outlines without a replacement.
- Replace the two broad `aria-live` regions with a single visually-hidden
  status element that receives one short sentence per change (e.g.
  «بازه زمانی به «امروز» تغییر کرد»).
- Implement proper roving `tabindex` and Arrow/Home/End handling for the
  scenario radiogroup; add `aria-checked` updates (already partially present).
- Convert the period selector to `aria-pressed` toggle buttons inside a
  labeled group.
- Add `@media (prefers-reduced-motion: reduce)` to disable the pulse animation,
  transitions, and smooth scrolling.
- Raise `--text-subtle` (or the surface behind it) until small text meets 4.5:1;
  verify the computed ratio and document it in a CSS comment.
- Ensure every section has a heading hierarchy without skipped levels.
- Remove `outline: none` from `.scenario-option:focus-visible` and
  `.period-button:focus-visible`, or pair it with a visible ring.

## Acceptance criteria

- [ ] Keyboard-only walkthrough: Tab reaches skip link → header → nav → each
      section CTA → form; focus is always visible.
- [ ] Scenario options respond to ArrowLeft/ArrowRight (RTL-aware), Home and End;
      only the selected option is in the tab order.
- [ ] Period buttons expose `aria-pressed` and the state matches the visual
      selection.
- [ ] After a scenario or period change, exactly one short status sentence is
      announced, not the whole panel.
- [ ] With `prefers-reduced-motion: reduce`, `.pulse-line` has no animation and
      no transition runs longer than 0.01 ms.
- [ ] Contrast: body text ≥ 4.5:1, large text ≥ 3:1, UI boundaries ≥ 3:1.
      Record measured ratios in the PR description.
- [ ] `rg "outline: none" assets/css` returns only rules paired with an
      alternative visible indicator.
- [ ] No heading level is skipped (h1 → h2 → h3/h4 only).
- [ ] Heading order and landmarks (`header`, `nav`, `main`, `footer`) verified by
      static inspection of the DOM.

## Files

- `index.html` — skip link, aria attributes, heading levels
- `assets/css/style.css` — focus ring, reduced motion, contrast tokens
- `assets/js/script.js` — roving tabindex, keyboard handling, status announcer

## Out of scope

- Full WCAG 2.2 AA audit with assistive-technology testing.
- Screen-reader testing with NVDA/JAWS (document as a manual follow-up).
- Redesigning components.

## Notes for the agent

Do not launch a browser or install Playwright/Puppeteer. Validate by static
inspection, DOM reasoning, and contrast computation in a script. If you compute
contrast, include the script output in the PR body.
