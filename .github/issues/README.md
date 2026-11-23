# Agent backlog — Iran market gaps

> **All nine issues are implemented and pushed.** Each file starts with its
> landing commit; the table below records the outcome.

Nine self-contained work orders derived from an audit of the shipped landing page
against Iranian B2G expectations (municipal procurement, Iranian network
conditions, Persian financial/date conventions, and the competitors the page
positions against).

Each file is a complete issue: rationale, scope, checkable acceptance criteria,
file list, and out-of-scope notes. They are designed to be picked up by an AI
agent without further context, and to be published as GitHub issues verbatim.

## Publish

```bash
./scripts/create-github-issues.sh            # uses gh, repo from git remote
REPO=owner/name ./scripts/create-github-issues.sh
```

The script skips issues it has already created (matched by title).

## Order and rationale

| # | Issue | Priority | Why it blocks | Depends on |
|---|---|---|---|---|
| 01 | [Self-host Vazirmatn](01-self-host-vazirmatn.md) | P0 | Third-party font CDN is unreliable from Iran and is a procurement objection | — |
| 02 | [Persian formatting layer](02-persian-formatting-layer.md) | P0 | Jalali dates and Toman exist nowhere; every future report needs them | — |
| 03 | [Real lead form](03-real-lead-form.md) | P0 | The only conversion path currently does nothing | 02 (mobile/digit helpers) |
| 05 | [A11y and RTL hardening](05-a11y-rtl-hardening.md) | P1 | Required for municipal accessibility clauses; fixes invalid radio group | 02 |
| 04 | [SEO and discoverability](04-seo-discoverability.md) | P1 | No OG preview, sitemap, structured data, or favicon | — |
| 06 | [B2G trust layer](06-b2g-trust-layer.md) | P1 | Buyers ask about hosting, RBAC, SLA, tender docs immediately | — |
| 07 | [Iranian integration adapters](07-iran-integration-adapters.md) | P1 | "Open integration" is claimed but unproven; 137/GIS/ITS are the real questions | — |
| 08 | [Data-driven demo content](08-data-driven-demo-content.md) | P2 | Localizing a demo per prospect is currently a code change | — |
| 09 | [CI, 404, integrity checks](09-ci-and-404.md) | P2 | Regressions (stale brand color, fake form) shipped twice | 04 (for robots/sitemap smoke) |

## Audit findings not turned into issues

These were observed but are either out of scope for a static landing page or need
a business decision first:

- **Pricing page** — needs approved numbers; blocked on commercial input.
- **Case studies / reference cities** — no real deployments to cite; must not be
  invented.
- **English version** — useful for investors, not required for Iranian municipal
  buyers.
- **Analytics / consent** — depends on a chosen vendor and privacy position.
- **PNG OG image** — follow-up to 04; needs a rasterization step.
- **Real backend for leads** — follow-up to 03; needs a hosting and privacy
  decision.

## Conventions

- Labels used in the specs: `type:*`, `area:*`, `market:iran`, `priority:p0|p1|p2`.
- Every acceptance criterion is verifiable without a browser.
- No speculative connectors, customers, certifications, or numbers.

## Implementation record

| # | Issue | Commit | What shipped |
|---|---|---|---|
| 01 | Self-host Vazirmatn | `bed80b2` | Five woff2 weights + OFL license, `@font-face`, no CDN requests |
| 02 | Persian formatting | `90d594e` | `assets/js/format.js`, Jalali conversion, Toman/percent helpers, render-time formatting |
| 03 | Real lead form | `0f9e11b` | Labeled form, Iranian mobile validation, consent, honeypot, `submitLead` adapter |
| 04 | SEO discoverability | `7a5f3d3` | OG/Twitter cards, canonical, JSON-LD, favicon, OG cover, robots, sitemap |
| 05 | A11y & RTL hardening | `65326ee` | Skip link, focus rings, roving tabindex, `aria-pressed`, short announcements, reduced motion, AA contrast |
| 06 | B2G trust layer | `4dbea38` | `#trust` section with honest placeholders, `docs/procurement.md` |
| 07 | Iranian integrations | `cc70400` | `docs/integrations.md`, JSON Schema, example adapter, validator, `#integrations` section |
| 08 | Data-driven demo | `45e04d0` | `assets/data/*.json`, `assets/js/data.js`, `file://` fallback |
| 09 | CI, 404, integrity | `7998d76` | Read-only workflow, anchor checker, Persian 404, nginx config, guard tests |

Test suite: 96 tests via `node --test tests/`, no dependencies.
