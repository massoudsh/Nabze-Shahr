import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const html = await read("404.html");
const dockerfile = await read("Dockerfile");
const dockerignore = await read(".dockerignore");
const nginx = await read("nginx/default.conf");
const ci = await read(".github/workflows/ci.yml");

test("the 404 page is Persian, right-to-left, and noindex", () => {
  assert.match(html, /<html lang="fa" dir="rtl">/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /خطای ۴۰۴/);
});

test("the 404 page links back to the site root", () => {
  assert.match(html, /<a class="btn btn-primary" href="\/">/);
});

test("the 404 page reuses the shared design tokens", () => {
  assert.match(html, /\/assets\/css\/style\.css/);
  const custom = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  // Colours must come from variables, not hard-coded hex values.
  assert.doesNotMatch(custom, /#[0-9a-fA-F]{6}/);
});

test("nginx serves 404.html with a real 404 status", () => {
  assert.match(nginx, /error_page 404 \/404\.html/);
  assert.match(nginx, /try_files \$uri \$uri\/ =404/);
  assert.match(nginx, /listen 8080/);
});

test("the image ships 404, robots, sitemap, and the nginx config", () => {
  assert.match(dockerfile, /404\.html/);
  assert.match(dockerfile, /robots\.txt sitemap\.xml/);
  assert.match(dockerfile, /nginx\/default\.conf/);
  for (const entry of ["!404.html", "!nginx/", "!nginx/default.conf"]) {
    assert.ok(dockerignore.includes(entry), `missing allowlist entry ${entry}`);
  }
});

test("the health check still targets port 8080", () => {
  assert.match(dockerfile, /HEALTHCHECK/);
  assert.match(dockerfile, /127\.0\.0\.1:8080/);
});

test("CI is read-only and runs on main for pushes and PRs", () => {
  assert.match(ci, /permissions:\s*\n\s*contents: read/);
  assert.match(ci, /push:/);
  assert.match(ci, /pull_request:/);
  assert.match(ci, /branches: \[main\]/);
});

test("CI runs the tests and the integrity scripts", () => {
  for (const command of [
    "node --test tests/",
    "node scripts/check-anchors.mjs",
    "node scripts/validate-adapter.mjs docs/adapter-example.json",
    "docker build",
  ]) {
    assert.ok(ci.includes(command), `CI is missing: ${command}`);
  }
});

test("CI guards against the regressions that already shipped once", () => {
  assert.match(ci, /#22d3ee/);
  assert.match(ci, /fonts\.googleapis\.com/);
  assert.match(ci, /style="/);
});

test("every test file is picked up by the runner", async () => {
  const files = await readdir(new URL("../tests", import.meta.url));
  const testFiles = files.filter((name) => name.endsWith(".test.mjs"));
  assert.ok(testFiles.length >= 8, `expected the full suite, found ${testFiles.length}`);
});
