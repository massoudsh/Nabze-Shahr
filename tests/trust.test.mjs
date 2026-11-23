import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const procurement = await readFile(
  new URL("../docs/procurement.md", import.meta.url),
  "utf8"
);

const section = (() => {
  const start = html.indexOf('id="trust"');
  assert.ok(start > -1, "expected a #trust section");
  return html.slice(start, html.indexOf("</section>", start));
})();

test("the trust section has the four buying-committee blocks", () => {
  for (const heading of [
    "استقرار و مالکیت داده",
    "امنیت و دسترسی",
    "پشتیبانی و توافق سطح خدمات",
    "آمادگی فرآیند خرید",
  ]) {
    assert.ok(section.includes(heading), `missing block: ${heading}`);
  }
  assert.equal((section.match(/<article class="trust-card">/g) ?? []).length, 4);
});

test("undecided numbers are marked instead of invented", () => {
  assert.match(section, /برای تأیید در قرارداد/);
  // No fabricated uptime, response-time, or certification claims.
  assert.doesNotMatch(section, /۹۹(\.\d+)?٪\s*آپ‌تایم|99(\.\d+)?%\s*uptime/i);
  assert.doesNotMatch(section, /ISO\s*\d{4,5}|ایزو\s*\d{4,5}/);
  assert.doesNotMatch(section, /ساعت\s*پاسخ|پاسخ\s*حداکثر\s*\d/i);
});

test("the trust section does not link to files the image does not serve", () => {
  assert.doesNotMatch(section, /href="docs\//);
});

test("the nav links to #trust and the section exists for the observer", () => {
  assert.match(html, /<a href="#trust">/);
  assert.match(html, /<section id="trust"/);
});

test("the navigation anchors all resolve to a real section id", () => {
  const links = [...html.matchAll(/<a href="#([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const missing = links.filter((target) => target !== "top" && !ids.has(target));
  assert.deepEqual(missing, []);
});

test("the procurement doc covers the four artifacts with owners", () => {
  for (const artifact of [
    "پاسخ به RFP",
    "مشخصات فنی",
    "توافق‌نامه اشتراک داده",
    "کاتالوگ",
  ]) {
    assert.ok(procurement.includes(artifact), `missing artifact: ${artifact}`);
  }
  assert.ok((procurement.match(/TODO\(/g) ?? []).length >= 4);
});

test("the README points at the procurement doc", () => {
  assert.match(readme, /docs\/procurement\.md/);
});
