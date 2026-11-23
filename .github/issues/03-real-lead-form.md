# 03 — Turn the demo contact form into a real, validated lead form

<!-- labels: type:bug,type:feature,area:conversion,market:iran,priority:p0 -->
<!-- agent: frontend -->

## Why (Iran market demand)

The only conversion path on the page is fake. `index.html:470` uses
`onsubmit="return false;"`, the two inputs are placeholder-only (no labels, an
accessibility failure that also hurts older municipal users), and
`script.js:156` injects an inline-styled message using the **old** brand color
`#22d3ee` that no longer exists in the design system.

For Iranian B2G sales, a demo request is typically followed by a phone call from
a specific organizational unit. The form therefore needs: organization and role,
a validated Iranian mobile number, an optional landline, explicit consent for
being contacted, and a clear "what happens next" statement — so leads are
actionable instead of an email address with no owner.

## Scope

Replace the form with a labeled, validated form:

- Fields: `fullName`, `organization`, `role`, `mobile` (Iranian mobile, `09`
  prefix, 11 digits, normalize Persian/Arabic digits and `+98`), `email`
  (optional but validated if present), `message`, `consent` (required checkbox).
- Use `<label>` for every control, `aria-describedby` for helper/error text,
  `aria-invalid` on failure, `role="status"` for the success message, and focus
  the first invalid field on submit.
- Honeypot field (`companyWebsite`) hidden from users and screen readers; if
  filled, silently succeed without calling the adapter.
- Client-side validation only, with Persian error messages.
- A submit adapter: `window.NabzShahr.submitLead(payload)` with a documented
  default implementation that resolves after a short delay and is the single
  integration point for a future backend. Payload shape is documented in
  `docs/lead-payload.md`.
- Remove `onsubmit`, remove all inline `style=` attributes, use existing CSS
  tokens, and add the missing form styles to `assets/css/style.css`.

## Acceptance criteria

- [ ] `rg "onsubmit|#22d3ee" index.html assets/js` returns nothing.
- [ ] Form submits with keyboard only; every field is reachable and labeled.
- [ ] Invalid submit shows per-field errors, sets `aria-invalid="true"`, and
      focuses the first invalid field.
- [ ] `09123456789`, `۰۹۱۲۳۴۵۶۷۸۹`, `+989123456789` all validate; `0812345678`
      and `0912345` are rejected.
- [ ] Consent is required; submit is blocked with an explanatory message when
      unchecked.
- [ ] Success state is announced via `role="status"` and explains the next step
      (e.g. "کارشناس ما در روزهای کاری تماس می‌گیرد").
- [ ] Honeypot submission does not call the adapter.
- [ ] `docs/lead-payload.md` documents the JSON payload and adapter contract.
- [ ] No layout shift or overflow at 360 px width.

## Files

- `index.html` — form markup
- `assets/css/style.css` — form, error, and success styles
- `assets/js/script.js` — validation + adapter
- `docs/lead-payload.md` — new

## Out of scope

- Sending email, SMS, or CRM integration.
- Captcha or rate limiting (server-side concern).
- Collecting national ID or other sensitive identifiers — do not add them.

## Notes for the agent

Never log or persist form values to `localStorage`. Do not add a third-party form
service. Keep the form usable if JavaScript is disabled: show a plain
`mailto:` fallback link in a `<noscript>` block.
