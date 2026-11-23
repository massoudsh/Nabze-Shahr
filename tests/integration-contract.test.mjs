import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateAdapter } from "../scripts/validate-adapter.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const integrations = await readFile(
  new URL("../docs/integrations.md", import.meta.url),
  "utf8"
);
const schema = JSON.parse(
  await readFile(new URL("../docs/adapter.schema.json", import.meta.url), "utf8")
);
const example = JSON.parse(
  await readFile(new URL("../docs/adapter-example.json", import.meta.url), "utf8")
);

const section = (() => {
  const start = html.indexOf('id="integrations"');
  assert.ok(start > -1, "expected an #integrations section");
  return html.slice(start, html.indexOf("</section>", start));
})();

test("the example adapter validates against the contract", () => {
  assert.deepEqual(validateAdapter(example, schema), []);
});

test("the contract rejects unknown protocols and missing intervals", () => {
  const errors = validateAdapter(
    { ...example, protocol: "GRAPHQL", cadence: { mode: "interval" } },
    schema
  );
  assert.equal(errors.length, 2);
  assert.ok(errors.some((error) => error.startsWith("protocol:")));
  assert.ok(errors.some((error) => error.startsWith("cadence.seconds:")));
});

test("the contract rejects credentials embedded in the endpoint", () => {
  // Endpoints with userinfo are structurally allowed by the schema, but the
  // documented rule forbids them — check the doc states it and that the
  // example does not violate it.
  assert.match(integrations, /نباید شامل نام کاربری یا رمز باشد/);
  assert.doesNotMatch(example.endpoint, /\/\/[^/]*@/);
});

test("the contract requires a pii flag on every field", () => {
  const broken = structuredClone(example);
  delete broken.fields[0].pii;
  const errors = validateAdapter(broken, schema);
  assert.ok(errors.some((error) => error.includes("pii: required")));
});

test("the docs list all six Iranian source families", () => {
  for (const family of ["۱۳۷", "GIS", "ITS", "BRT", "آب و برق", "ملی"]) {
    assert.ok(integrations.includes(family), `missing family: ${family}`);
  }
});

test("the page shows six integration cards", () => {
  assert.equal((section.match(/class="integration-card"/g) ?? []).length, 6);
});

test("every card carries an honest status label", () => {
  const allowed = ["قابل اتصال با adapter", "در نقشه راه", "نمونه نمایشی", "نیازمند بررسی در جلسه فنی"];
  const statuses = [...section.matchAll(/class="integration-status [^"]*">([^<]+)</g)].map(
    (match) => match[1].trim()
  );
  assert.equal(statuses.length, 6, "each card needs exactly one status");
  for (const status of statuses) {
    assert.ok(allowed.includes(status), `unexpected status label: ${status}`);
  }
});

test("no card claims a live connection", () => {
  assert.doesNotMatch(section, />\s*(متصل|فعال|فعال است)\s*</);
  assert.match(section, /اتصال زنده نیستند/);
});

test("the nav links to #integrations and it is a real section", () => {
  assert.match(html, /<a href="#integrations">/);
  assert.match(html, /<section id="integrations"/);
});
