import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  validateScenarios,
  validateDashboard,
  loadScenarios,
  loadDashboard,
  fallbacks,
} from "../assets/js/data.js";

const readJson = async (name) =>
  JSON.parse(await readFile(new URL(`../assets/data/${name}`, import.meta.url), "utf8"));

const scenarios = await readJson("scenarios.json");
const dashboard = await readJson("dashboard.json");

test("both data files exist, parse, and validate", () => {
  assert.deepEqual(validateScenarios(scenarios), []);
  assert.deepEqual(validateDashboard(dashboard), []);
});

test("the content matches what the page showed before the refactor", () => {
  assert.equal(scenarios.items.traffic.name, "تغییر مسیر محور مرکزی");
  assert.equal(scenarios.items.traffic.travel.delta, -12);
  assert.equal(scenarios.items.construction.scope.values.join(","), "3,8");
  assert.equal(scenarios.items.crisis.decision, "اولویت بالا برای آمادگی عملیاتی");

  assert.equal(dashboard.items.now.traffic.detail.percent, 86);
  assert.equal(dashboard.items.today.incident.status.count, 9);
  assert.equal(dashboard.items.week.priorityNote.values[0], 3);
  assert.equal(dashboard.items.week.incident.detail.percent, 87);
});

test("the data files carry no literal Persian digits", () => {
  const raw = JSON.stringify(scenarios) + JSON.stringify(dashboard);
  const digits = raw.match(/[۰-۹]/g) ?? [];
  assert.deepEqual(digits, [], `found Persian digits: ${digits.join("")}`);
});

test("validation rejects a missing required key", () => {
  const broken = structuredClone(scenarios);
  delete broken.items.traffic.decision;
  const errors = validateScenarios(broken);
  assert.ok(errors.some((error) => error.includes("decision")));
});

test("validation rejects a bad stateClass", () => {
  const broken = structuredClone(dashboard);
  broken.items.now.traffic.stateClass = "ok";
  const errors = validateDashboard(broken);
  assert.ok(errors.some((error) => error.includes('must be "good" or "watch"')));
});

test("validation requires exactly one usable default", () => {
  const broken = structuredClone(scenarios);
  broken.default = "missing";
  assert.ok(validateScenarios(broken).some((error) => error.includes("is not an item")));

  assert.equal(scenarios.default in scenarios.items, true);
  assert.equal(dashboard.default in dashboard.items, true);
});

test("the inline fallback is valid so file:// still renders real content", () => {
  assert.deepEqual(validateScenarios(fallbacks.scenarios), []);
  assert.deepEqual(validateDashboard(fallbacks.dashboard), []);
});

test("file:// skips fetch entirely and returns the fallback", async () => {
  const originalLocation = globalThis.location;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  globalThis.location = { protocol: "file:" };
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("fetch must not be called on file://");
  };

  try {
    const result = await loadScenarios();
    assert.equal(result.source, "fallback");
    assert.equal(fetchCalls, 0, "no fetch on file://");
    assert.equal(result.data.items[result.data.default].name, "تغییر مسیر محور مرکزی");
  } finally {
    globalThis.location = originalLocation;
    globalThis.fetch = originalFetch;
  }
});

test("a failed request falls back instead of rendering undefined", async () => {
  const originalLocation = globalThis.location;
  const originalFetch = globalThis.fetch;

  globalThis.location = { protocol: "http:" };
  globalThis.fetch = async () => ({ ok: false });

  try {
    const result = await loadDashboard();
    assert.equal(result.source, "fallback");
    assert.equal(result.data.items.now.period, "وضعیت اکنون");
  } finally {
    globalThis.location = originalLocation;
    globalThis.fetch = originalFetch;
  }
});

test("invalid remote data is rejected in favour of the fallback", async () => {
  const originalLocation = globalThis.location;
  const originalFetch = globalThis.fetch;

  globalThis.location = { protocol: "http:" };
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ default: "nope", items: {} }),
  });

  try {
    const result = await loadScenarios();
    assert.equal(result.source, "fallback");
  } finally {
    globalThis.location = originalLocation;
    globalThis.fetch = originalFetch;
  }
});

test("demo data ships in the image (assets/ is copied wholesale)", async () => {
  const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");
  const dockerignore = await readFile(new URL("../.dockerignore", import.meta.url), "utf8");
  assert.match(dockerfile, /COPY[^\n]*assets\//);
  assert.match(dockerignore, /!assets\/\*\*/);
});
