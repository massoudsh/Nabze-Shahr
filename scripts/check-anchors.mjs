#!/usr/bin/env node
/**
 * Fails when an in-page anchor has no matching id.
 *
 * Catches the classic regression: a nav link is added or a section id is
 * renamed, and the header silently scrolls nowhere.
 *
 * Usage: node scripts/check-anchors.mjs [file]
 */
import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "index.html";
const html = await readFile(file, "utf8");

const targets = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));

const missing = [...new Set(targets)].filter((target) => target !== "top" && !ids.has(target));

if (missing.length > 0) {
  console.error(`✗ ${file}: ${missing.length} broken anchor(s)`);
  for (const target of missing) console.error(`  - href="#${target}" has no matching id`);
  process.exit(1);
}

console.log(`✓ ${file}: ${new Set(targets).size} anchors resolve`);
