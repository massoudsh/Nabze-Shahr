import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/style.css", import.meta.url), "utf8");

/** @returns {Array<{tag: string, level: number, text: string}>} */
function headingsIn(document) {
  return [...document.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)].map((match) => ({
    tag: match[1],
    level: Number(match[1][1]),
    text: match[2].replace(/<[^>]+>/g, "").trim(),
  }));
}

test("the page has exactly one h1", () => {
  const h1s = headingsIn(html).filter((heading) => heading.tag === "h1");
  assert.equal(h1s.length, 1);
});

test("no heading level is skipped in document order", () => {
  const headings = headingsIn(html);
  let previous = 0;
  const skips = [];

  for (const heading of headings) {
    if (previous && heading.level > previous + 1) {
      skips.push(`${previous} -> ${heading.level} at «${heading.text.slice(0, 30)}»`);
    }
    previous = heading.level;
  }

  assert.deepEqual(skips, []);
});

test("the skip link is the first focusable element in the body", () => {
  const body = html.slice(html.indexOf("<body>"));
  const firstLink = body.match(/<a\b[^>]*class="([^"]*)"/);
  assert.ok(firstLink, "expected a link in the body");
  assert.match(firstLink[1], /skip-link/);
  assert.match(html, /<a class="skip-link" href="#top">/);
});

test("no rule removes an outline without an alternative indicator", () => {
  const offenders = [...css.matchAll(/[^{}]*\{[^{}]*outline:\s*none[^{}]*\}/g)]
    .map((match) => match[0])
    .filter((rule) => !/focus-visible|box-shadow/.test(rule));
  assert.deepEqual(offenders, [], `these rules clear the outline: ${offenders.join("\n")}`);
});

test("reduced motion disables the pulse animation", () => {
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.ok(block, "expected a prefers-reduced-motion block");
  assert.match(block[1], /\.pulse-line\s*\{[^}]*animation:\s*none/);
  assert.match(block[1], /animation-duration:\s*\.01ms\s*!important/);
  assert.match(block[1], /transition-duration:\s*\.01ms\s*!important/);
});

test("the document does not wrap whole panels in a live region", () => {
  assert.doesNotMatch(html, /class="impact-panel" aria-live/);
  assert.doesNotMatch(html, /class="dashboard-layout" aria-live/);
  // The narrow regions that remain are the metric lists.
  assert.match(html, /class="impact-metrics" aria-live="polite"/);
  assert.match(html, /class="dashboard-metrics" aria-live="polite"/);
});

test("the period selector exposes pressed-toggle semantics", () => {
  const buttons = [...html.matchAll(/<button[^>]*data-period="([^"]+)"[^>]*>/g)];
  assert.equal(buttons.length, 3);
  for (const [tag] of buttons) {
    assert.match(tag, /aria-pressed="(true|false)"/);
  }
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
});

test("the scenario radiogroup has a roving tabindex", () => {
  const options = [...html.matchAll(/<button[^>]*data-scenario="([^"]+)"[^>]*>/g)];
  assert.equal(options.length, 3);
  assert.equal((html.match(/tabindex="0"/g) ?? []).length, 1);
  assert.equal((html.match(/tabindex="-1"/g) ?? []).length >= 2, true);
  assert.match(html, /role="radiogroup"/);
});

test("small muted text meets the 4.5:1 contrast requirement", () => {
  const parse = (hex) => {
    const value = hex.replace("#", "");
    return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  };
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const [r, g, b] = parse(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const token = (name) => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(match, `missing token --${name}`);
    return match[1];
  };

  const surfaces = ["bg", "bg-soft", "surface", "surface-raised", "surface-muted"];
  for (const foreground of ["text-subtle", "text-muted", "text"]) {
    for (const background of surfaces) {
      const value = ratio(token(foreground), token(background));
      assert.ok(
        value >= 4.5,
        `--${foreground} on --${background} is ${value.toFixed(2)}:1, below 4.5:1`
      );
    }
  }
});

test("control boundaries meet the 3:1 UI component requirement", () => {
  const parse = (hex) => {
    const value = hex.replace("#", "");
    return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  };
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const [r, g, b] = parse(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];

  for (const background of ["bg", "bg-soft", "surface", "surface-raised", "surface-muted"]) {
    const value = ratio(token("border-strong"), token(background));
    assert.ok(value >= 3, `--border-strong on --${background} is ${value.toFixed(2)}:1`);
  }
});
