import test from "node:test";
import assert from "node:assert/strict";

import {
  toPersianDigits,
  formatNumber,
  formatToman,
  formatPercent,
  formatJalali,
  formatRelative,
} from "../assets/js/format.js";

const FA = { type: "fa" };

test("toPersianDigits converts ASCII digits only", () => {
  assert.equal(toPersianDigits("2026"), "۲۰۲۶");
  assert.equal(toPersianDigits("منطقه 6 — 09:30"), "منطقه ۶ — ۰۹:۳۰");
  assert.equal(toPersianDigits(1234), "۱۲۳۴");
  assert.equal(toPersianDigits("بدون رقم"), "بدون رقم");
});

test("formatNumber groups thousands with the Persian separator", () => {
  assert.equal(formatNumber(0), "۰");
  assert.equal(formatNumber(1234), "۱٬۲۳۴");
  assert.equal(formatNumber(12450), "۱۲٬۴۵۰");
  assert.equal(formatNumber(1234567), "۱٬۲۳۴٬۵۶۷");
  assert.equal(formatNumber(-9876543), "−۹٬۸۷۶٬۵۴۳");
  assert.equal(formatNumber(12.345, { maximumFractionDigits: 1 }), "۱۲.۳");
});

test("formatNumber returns a dash for invalid input", () => {
  for (const value of [null, undefined, "", "abc", NaN, Infinity]) {
    assert.equal(formatNumber(value), "—", `expected dash for ${String(value)}`);
  }
});

test("formatToman appends the unit and rejects invalid values", () => {
  assert.equal(formatToman(2500000), "۲٬۵۰۰٬۰۰۰ تومان");
  assert.equal(formatToman("1500"), "۱٬۵۰۰ تومان");
  assert.equal(formatToman("-4200"), "−۴٬۲۰۰ تومان");
  assert.equal(formatToman("nope"), "—");
});

test("formatPercent uses U+2212 for negatives and + for positives", () => {
  assert.equal(formatPercent(-12), "−۱۲٪");
  assert.equal(formatPercent(8), "+۸٪");
  assert.equal(formatPercent(0), "۰٪");
  assert.equal(formatPercent(8, { showSign: false }), "۸٪");
  assert.equal(formatPercent("x"), "—");
  assert.ok(formatPercent(-12).startsWith("−"), "must use the minus sign, not a hyphen");
  assert.ok(!formatPercent(-12).startsWith("-"));
});

test("formatJalali converts known Gregorian dates", () => {
  assert.equal(formatJalali("2026-03-21", "numeric", { timeZone: "UTC" }), "۱۴۰۵/۰۱/۰۱");
  assert.equal(formatJalali("2025-03-21", "numeric", { timeZone: "UTC" }), "۱۴۰۴/۰۱/۰۱");
  assert.equal(formatJalali(new Date("2026-11-23T12:00:00Z"), "numeric", { timeZone: "UTC" }), "۱۴۰۵/۰۹/۰۲");
  assert.equal(formatJalali("2026-11-23T12:00:00Z", "long", { timeZone: "UTC" }), "۲ آذر ۱۴۰۵");
});

test("formatJalali honours the leap day at the end of 1403", () => {
  // 1403 is a leap year: 1403/12/30 == 2025-03-20 (Gregorian).
  assert.equal(formatJalali("2025-03-20", "numeric", { timeZone: "UTC" }), "۱۴۰۳/۱۲/۳۰");
});

test("formatJalali rolls the year over at Nowruz 1404 -> 1405", () => {
  assert.equal(formatJalali("2026-03-20", "numeric", { timeZone: "UTC" }), "۱۴۰۴/۱۲/۲۹");
  assert.equal(formatJalali("2026-03-21", "numeric", { timeZone: "UTC" }), "۱۴۰۵/۰۱/۰۱");
});

test("formatJalali accepts epoch milliseconds", () => {
  const epoch = Date.UTC(2026, 10, 23, 9, 0, 0);
  assert.equal(formatJalali(epoch, "numeric", { timeZone: "UTC" }), "۱۴۰۵/۰۹/۰۲");
});

test("formatJalali returns a dash for invalid input", () => {
  for (const value of [null, undefined, "", "not-a-date", new Date("nope")]) {
    assert.equal(formatJalali(value), "—", `expected dash for ${String(value)}`);
  }
});

test("formatRelative describes past and future offsets", () => {
  const now = new Date("2026-11-23T12:00:00Z");

  assert.equal(formatRelative(now, now), "همین حالا");
  assert.equal(formatRelative("2026-11-23T09:00:00Z", now), "۳ ساعت پیش");
  assert.equal(formatRelative("2026-11-23T15:00:00Z", now), "۳ ساعت بعد");
  assert.equal(formatRelative("2026-11-22T12:00:00Z", now), "دیروز");
  assert.equal(formatRelative("2026-11-24T12:00:00Z", now), "فردا");
  assert.equal(formatRelative("2026-11-20T12:00:00Z", now), "۳ روز پیش");
  assert.equal(formatRelative("2026-09-01T12:00:00Z", now), "۲ ماه پیش");
  assert.equal(formatRelative("2025-11-23T12:00:00Z", now), "۲ آذر ۱۴۰۴");
  assert.equal(formatRelative(null, now), "—");
});

test("formatRelative defaults its reference to now", () => {
  const label = formatRelative(Date.now() - 5 * 60 * 1000);
  assert.equal(label, "۵ دقیقه پیش");
});

test("module has no external imports", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../assets/js/format.js", import.meta.url), "utf8");
  assert.equal(/^\s*import\s/m.test(source), false, "format.js must not import anything");
});
