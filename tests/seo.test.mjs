import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const dockerignore = await readFile(new URL("../.dockerignore", import.meta.url), "utf8");
const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");

const SITE = "https://nabzshahr.ir";
const meta = (property) => {
  const match = html.match(
    new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)"`)
  );
  return match?.[1];
};

test("title and Open Graph title agree", () => {
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  assert.equal(meta("og:title"), title);
});

test("description and Open Graph description agree", () => {
  const description = meta("description");
  assert.ok(description && description.length > 50);
  assert.equal(meta("og:description"), description);
});

test("the share-preview essentials are present with real values", () => {
  for (const property of ["og:type", "og:site_name", "og:locale", "og:url", "og:image"]) {
    assert.ok(meta(property), `missing ${property}`);
  }
  assert.equal(meta("og:locale"), "fa_IR");
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("theme-color"), "#0b0d0f");
});

test("canonical, og:url, and sitemap agree on one domain", () => {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
  assert.equal(canonical, `${SITE}/`);
  assert.equal(meta("og:url"), `${SITE}/`);

  const sitemap = html.includes(`${SITE}/assets/img/og-cover.svg`);
  assert.ok(sitemap, "og:image must be an absolute URL on the canonical domain");
});

test("the placeholder domain is documented in the README", () => {
  assert.match(readme, /nabzshahr\.ir/);
  assert.match(readme, /پیش از انتشار/);
});

test("every JSON-LD block parses as JSON", () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length >= 3, `expected at least 3 blocks, found ${blocks.length}`);
  for (const [, body] of blocks) {
    assert.doesNotThrow(() => JSON.parse(body), "invalid JSON-LD block");
  }
});

test("FAQ structured data mirrors the visible FAQ text exactly", () => {
  const visible = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map(
    ([, question, answer]) => ({ question: question.trim(), answer: answer.trim() })
  );
  assert.ok(visible.length > 0, "expected visible FAQ items");

  const faqBlock = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, body]) => JSON.parse(body))
    .find((data) => data["@type"] === "FAQPage");
  assert.ok(faqBlock, "expected a FAQPage block");

  assert.equal(faqBlock.mainEntity.length, visible.length);
  visible.forEach((item, index) => {
    assert.equal(faqBlock.mainEntity[index].name, item.question);
    assert.equal(faqBlock.mainEntity[index].acceptedAnswer.text, item.answer);
  });
});

test("organization and website blocks point at the canonical domain", () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    ([, body]) => JSON.parse(body)
  );
  const organization = blocks.find((data) => data["@type"] === "Organization");
  const website = blocks.find((data) => data["@type"] === "WebSite");

  assert.ok(organization && website);
  assert.equal(organization.url, `${SITE}/`);
  assert.equal(website.url, `${SITE}/`);
  assert.equal(website.inLanguage, "fa-IR");
  assert.ok(organization.logo.startsWith(SITE));
  assert.ok(organization.contactPoint?.[0]?.email);
});

test("robots.txt and sitemap.xml ship in the image", () => {
  for (const file of ["robots.txt", "sitemap.xml"]) {
    assert.ok(dockerignore.includes(`!${file}`), `${file} must be allowlisted`);
  }
  assert.match(dockerfile, /robots\.txt sitemap\.xml/);
});

test("robots.txt allows crawling and references the sitemap", async () => {
  const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap\\.xml`));
});

test("the favicon and cover assets exist and are well-formed SVG", async () => {
  for (const file of ["favicon.svg", "og-cover.svg"]) {
    const source = await readFile(new URL(`../assets/img/${file}`, import.meta.url), "utf8");
    assert.match(source, /^<svg /);
    assert.match(source, /<\/svg>\s*$/);
    assert.equal((source.match(/<svg /g) ?? []).length, 1);
  }
  const cover = await readFile(new URL("../assets/img/og-cover.svg", import.meta.url), "utf8");
  assert.match(cover, /width="1200"/);
  assert.match(cover, /height="630"/);
});
