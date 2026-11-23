> **Status:** ✅ Done — commit bed80b2

# 01 — Self-host Vazirmatn and remove the Google Fonts dependency

<!-- labels: type:enhancement,area:performance,market:iran,priority:p0 -->
<!-- agent: frontend -->

## Why (Iran market demand)

`index.html:8-10` loads Vazirmatn from `fonts.googleapis.com` two render-blocking
requests plus two preconnects. Google Fonts is frequently slow or unreachable from
Iranian networks. For a B2G audience (municipal offices, restricted networks,
government tenders) a third-party font CDN is a visible reliability and
procurement risk, and it also makes the Docker image depend on an external service
at runtime.

## Scope

- Vendor Vazirmatn woff2 files for weights 300, 400, 500, 700, 900 into
  `assets/fonts/` together with the upstream `OFL.txt`.
- Replace the CDN `<link>` tags with `@font-face` declarations in
  `assets/css/style.css`.
- Keep `font-display: swap` and the existing fallback stack
  (`Tahoma, sans-serif`).
- Preload only the two most-used weights (400 and 700) to avoid a large
  preload budget.

## Acceptance criteria

- [ ] `rg "fonts.googleapis|fonts.gstatic" index.html assets/` returns nothing.
- [ ] `assets/fonts/` contains `.woff2` files for all five weights plus `OFL.txt`.
- [ ] `style.css` declares `@font-face` rules with `font-display: swap`,
      `font-weight`, and `src` pointing at relative `../fonts/*.woff2` paths.
- [ ] Page still renders Persian text with the project font when opened from the
      built image with no internet access (verify by inspecting requests, not by
      adding a browser).
- [ ] `README.md` notes that the font is bundled and that no external font request
      is made.

## Files

- `index.html` — remove preconnect + stylesheet links
- `assets/css/style.css` — add `@font-face` block at the top
- `assets/fonts/` — new
- `README.md` — document the change

## Out of scope

- Subsetting or variable-font conversion.
- Changing the visual design or type scale.

## Test plan

- `rg` check for removed external references.
- `docker compose up -d --build` on an SSH build host, then confirm the HTML and
  CSS reference only local font files.
- Visual check that headings and body text still use Vazirmatn (glyph shape).

## Notes for the agent

Do not fabricate binary font files. If network egress is blocked, add
`scripts/fetch-fonts.sh` that downloads the pinned upstream release with `curl`
and documents the expected filenames, and state clearly in the PR that the
binaries were not committed.
