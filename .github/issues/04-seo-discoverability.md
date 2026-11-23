# 04 — Add discoverability essentials: metadata, structured data, sitemap, favicon

<!-- labels: type:feature,area:seo,market:iran,priority:p1 -->
<!-- agent: frontend -->

## Why (Iran market demand)

The page has a title and description only. There is no canonical URL, no Open
Graph or Twitter card, no structured data, no `robots.txt`, no `sitemap.xml`, no
favicon, and no `theme-color`. Iranian B2G buyers discover vendors through
Google search, Telegram/LinkedIn link previews, and forwarded messages — all of
which render poorly without OG tags. Municipal procurement teams also expect a
recognizable domain-level identity (favicon, canonical URL) before treating a
vendor site as legitimate.

## Scope

1. `index.html` head:
   - canonical link with a single documented placeholder domain
   - `theme-color` matching `--bg`
   - OG (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:locale=fa_IR`,
     `og:image`, `og:url`) and Twitter (`summary_large_image`) tags
   - `<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">`
2. New `assets/img/favicon.svg` — a clean, single-purpose mark derived from the
   existing pulse-path logo, readable at 16 px (no text, bold strokes).
3. New `assets/img/og-cover.svg` — 1200×630 cover with product name and one
   value proposition line, safe-area margins respected.
4. New `robots.txt` — allow all, reference the sitemap.
5. New `sitemap.xml` — single URL, valid XML, `<lastmod>` in ISO date.
6. JSON-LD in `index.html`:
   - `Organization` (name, url, logo, sameAs placeholders, contactPoint)
   - `WebSite`
   - `FAQPage` built from the four existing FAQ items — must mirror the visible
     text exactly.
7. Update `Dockerfile` only if new top-level files (`robots.txt`,
   `sitemap.xml`, `404.html`) are not already covered; verify they are copied
   into the image.

## Acceptance criteria

- [ ] Every added meta tag has a real value; no duplicate `og:title`/`<title>`
      mismatch.
- [ ] Placeholder domain appears once, in a documented location, and is listed
      in `README.md` under "پیش از انتشار".
- [ ] JSON-LD blocks parse as valid JSON and the FAQPage entries match the
      visible FAQ questions and answers verbatim.
- [ ] `robots.txt` and `sitemap.xml` are reachable in the built container
      (`curl -I` against the running image on the build host).
- [ ] Favicon renders legibly at 16 px and 32 px (inspect the SVG at both sizes
      via a static render, not by launching a browser).
- [ ] `xmllint --noout sitemap.xml` (or an equivalent stdlib XML parse) passes.
- [ ] No 404s for referenced assets after `docker build`.

## Files

- `index.html`, `robots.txt`, `sitemap.xml`, `assets/img/favicon.svg`,
  `assets/img/og-cover.svg`, `README.md`, `Dockerfile` (only if needed)

## Out of scope

- Buying or configuring a domain.
- Rasterizing a PNG OG image (document as a follow-up; some crawlers prefer PNG).
- Adding a cookie/analytics consent script.
- Multi-page sitemap or hreflang.

## Notes for the agent

Do not claim a real domain, social profile, or address that the project does not
own — use obviously-placeholder values and list them in the README checklist.
Keep `sitemap.xml` in sync with the canonical URL placeholder.
