# 06 — Build the B2G trust layer: hosting, security, SLA, procurement pack

<!-- labels: type:feature,area:content,market:iran,priority:p1 -->
<!-- agent: content+frontend -->

## Why (Iran market demand)

The page claims auditability, role-based security, and low-connectivity
deployment in the differentiators section, but there is no page-level proof
layer. In Iranian municipal sales the buying committee asks, in this order:

1. Where does the data live, and can it be hosted inside the organization?
2. Who can see what, and is there a log of decisions?
3. What is the support model and response time?
4. What documents do we need for a tender (RFP response, company profile,
   sample contract, technical datasheet)?

Today the FAQ answers data residency in one sentence (`index.html:459`) and
nothing else exists. Missing this layer stalls the deal after the first meeting.

## Scope

Add a `#trust` section (before `#pilot`) with four concrete blocks:

| Block | Content |
|---|---|
| استقرار و مالکیت داده | on-prem / private-cloud / hybrid options, backup policy, data retention, export format |
| امنیت و دسترسی | RBAC roles, audit log of scenario changes, session policy, no PII in demo data |
| پشتیبانی و SLA | support tiers with response-time windows, working days, escalation path |
| آمادگی فرآیند خرید | tender/RFP response template, technical datasheet, sample DPA, catalog download |

Also add `docs/procurement.md` describing the four artifacts, what each contains,
and who fills it in — with clear TODO markers where the business must supply real
numbers.

Add a small anchor link in the main nav and wire it into the existing active-nav
observer without breaking the mobile menu.

## Acceptance criteria

- [ ] `#trust` section exists with the four blocks, each with a heading and
      scannable content (no wall of text).
- [ ] No fabricated certification, standard number, uptime figure, or response
      time. Every number that is not yet decided renders as
      «برای تأیید در قرارداد» or a clearly marked placeholder.
- [ ] `docs/procurement.md` exists and lists the four artifacts with owner and
      contents, marking unknowns as `TODO(owner)`.
- [ ] Catalog download link exists but is disabled/annotated until a real file is
      attached — do not link to a missing file.
- [ ] Nav link to `#trust` is highlighted correctly by the IntersectionObserver
      logic and closes the mobile menu on tap.
- [ ] Layout is responsive at 360 px, 768 px, and 1280 px with no overflow.
- [ ] Persian copy uses consistent terminology with the existing page
      (e.g. «محیط اختصاصی سازمان», «ردپای تصمیم»).

## Files

- `index.html` — new section + nav link
- `assets/css/style.css` — trust grid styles
- `docs/procurement.md` — new
- `README.md` — link to the procurement doc

## Out of scope

- Writing the actual RFP response or legal documents.
- Claims about specific certifications the company does not hold.
- Pricing numbers (handled in a separate issue).

## Notes for the agent

This is a trust surface: an invented SLA or certification is worse than an empty
slot. Prefer explicit placeholders and a checklist over confident marketing copy.
