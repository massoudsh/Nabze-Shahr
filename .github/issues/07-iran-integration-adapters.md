> **Status:** ✅ Done — commit cc70400

# 07 — Document and surface Iranian integration adapters (137, GIS, ITS, BRT)

<!-- labels: type:feature,area:integrations,market:iran,priority:p1 -->
<!-- agent: backend+frontend -->

## Why (Iran market demand)

"Open integration" is one of the five differentiators on the page, but there is
no artifact behind it. Iranian municipalities run a known, recognizable set of
systems, and buyers immediately ask "does it connect to what we already have?":

- سامانه ۱۳۷ / سامانه مدیریت درخواست‌های شهروندی
- سامانه جامع GIS شهرداری (ArcGIS / GeoServer / WMS-WFS layers)
- سامانه‌های هوشمند کنترل ترافیک و ثبت تخلف (ITS، دوربین‌های پایش)
- AVL اتوبوس و BRT، و داده ایستگاه‌ها
- تله‌متری آب و برق و داده‌های زیرساخت
- سامانه‌های ملی/وزارت کشوری که شهرداری موظف به گزارش‌دهی به آن‌هاست

Without a named list and a machine-readable contract, the claim is unfalsifiable
and procurement cannot scope a pilot.

## Scope

1. New `docs/integrations.md` containing:
   - A table of the six source families above with: purpose, typical protocol
     (WFS/REST/MQTT/SOAP/file drop), refresh cadence, PII sensitivity, and
     current support status.
   - An **adapter contract** JSON schema: `sourceId`, `displayName`, `protocol`,
     `endpoint`, `auth.type`, `cadence`, `fields[]` (`name`, `type`, `unit`,
     `pii`), `version`, `healthCheck`.
   - A worked example payload for a traffic-count adapter.
   - Compatibility guidance for Iranian hosting constraints (no outbound
     internet, national intranet, proxy).
2. New `index.html` section `#integrations` (before `#differentiators`) showing
   the six families as cards with an honest status label:
   `نمونه نمایشی` / `در نقشه راه` / `قابل اتصال با adapter`.
3. No fake "connected" state: the status must be one of the three labels above
   and must not imply a live connector.

## Acceptance criteria

- [ ] `docs/integrations.md` exists with the six families and the JSON schema.
- [ ] The example adapter payload validates against the schema with a Node
      script (`node --test tests/integration-contract.test.mjs` or a simple
      `scripts/validate-adapter.mjs`).
- [ ] `#integrations` section renders six cards, each with a status label and one
      sentence of value; no card claims a live connection.
- [ ] Nav gains an `#integrations` link that works with the active-section
      observer and the mobile menu.
- [ ] Persian copy names the systems the way Iranian practitioners do (۱۳۷،
      GIS، ITS، BRT، AVL) — no invented product names.
- [ ] Responsive: 6 cards collapse to 3, 2, then 1 column.

## Files

- `docs/integrations.md` — new
- `index.html` — new section + nav link
- `assets/css/style.css` — integrations grid
- `scripts/validate-adapter.mjs` or `tests/integration-contract.test.mjs` — new

## Out of scope

- Writing real connectors, credentials, or network calls.
- Naming specific municipal vendors as customers or partners.
- Handling actual citizen PII.

## Notes for the agent

Do not invent protocol details for a specific municipality. Where the real
interface is unknown, write `نیازمند بررسی در جلسه فنی` and keep the schema
generic. Any PII-bearing field must be marked `"pii": true` in the example.
