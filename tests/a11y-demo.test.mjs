import test from "node:test";
import assert from "node:assert/strict";

let importCounter = 0;
const nextImportId = () => `${++importCounter}-${process.pid}`;
import { readFile } from "node:fs/promises";

/** Wait until the loader has rendered, instead of racing a fixed timer. */
async function waitForRender(elements, key = "scenarioName") {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const element = elements.get(key);
    if (element && element.textContent) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`timed out waiting for ${key} to render`);
}


/**
 * Drives the scenario radiogroup and period buttons headlessly to verify
 * keyboard support, roving tabindex, aria state, and short announcements.
 */
async function loadDemo() {
  const elements = new Map();
  const scenarioHandlers = new Map();
  const periodHandlers = new Map();
  let focusedId = null;

  const make = (id) => {
    const store = {};
    const element = {
      id,
      textContent: "",
      className: "",
      tabIndex: 0,
      dataset: {},
      addEventListener(type, fn) {
        if (type === "click") store.click = fn;
        if (type === "keydown") store.keydown = fn;
        this.store = store;
      },
      setAttribute(name, value) {
        this[`attr_${name}`] = value;
      },
      getAttribute(name) {
        return this[`attr_${name}`] ?? null;
      },
      focus() {
        focusedId = id;
      },
      classList: {
        _set: new Set(),
        toggle(name, force) {
          if (force) this._set.add(name);
          else this._set.delete(name);
        },
        contains(name) {
          return this._set.has(name);
        },
        remove(name) {
          this._set.delete(name);
        },
      },
    };
    return element;
  };

  const scenarioOptions = ["traffic", "construction", "crisis"].map((name, index) => {
    const element = make(`scenario-${name}`);
    element.dataset.scenario = name;
    element.tabIndex = index === 0 ? 0 : -1;
    // Mirror the initial attributes from index.html.
    element.setAttribute("aria-checked", String(index === 0));
    return element;
  });

  const periodButtons = ["now", "today", "week"].map((name) => {
    const element = make(`period-${name}`);
    element.dataset.period = name;
    // Mirror the initial attributes from index.html.
    element.setAttribute("aria-pressed", String(name === "now"));
    return element;
  });

  const status = make("demoStatus");
  elements.set("demoStatus", status);

  const mainNav = make("mainNav");
  mainNav.querySelectorAll = () => [];

  // Simulate a served page so the loader takes the fetch path.
  globalThis.location = { protocol: "http:" };
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => JSON.parse(await readFile(new URL(`../${url}`, import.meta.url), "utf8")),
  });
  globalThis.window = {};
  globalThis.document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, make(id));
      return elements.get(id);
    },
    querySelector: (selector) => (selector === ".main-nav" ? mainNav : null),
    querySelectorAll: (selector) => {
      if (selector === ".scenario-option") return scenarioOptions;
      if (selector === ".period-button") return periodButtons;
      return [];
    },
  };

  await import(`../assets/js/script.js?demo=${nextImportId()}`);
  // Content loads asynchronously; let the loader settle before asserting.
  await waitForRender(elements);

  return {
    aria: (element, name) => element.getAttribute(name),
    scenarioOptions,
    periodButtons,
    status,
    focused: () => focusedId,
    click: (element) => element.store.click(),
    key: (element, key) => element.store.keydown({ key, preventDefault() {} }),
  };
}

test("only the selected scenario option is in the tab order", async () => {
  const demo = await loadDemo();
  assert.deepEqual(demo.scenarioOptions.map((o) => o.tabIndex), [0, -1, -1]);

  demo.click(demo.scenarioOptions[2]);
  assert.deepEqual(demo.scenarioOptions.map((o) => o.tabIndex), [-1, -1, 0]);
});

test("arrow keys move selection and focus, RTL-aware", async () => {
  const demo = await loadDemo();
  const [traffic, construction, crisis] = demo.scenarioOptions;

  // RTL: ArrowLeft advances to the next visual item.
  demo.key(traffic, "ArrowLeft");
  assert.equal(demo.aria(construction, "aria-checked"), "true");
  assert.equal(demo.focused(), "scenario-construction");

  demo.key(construction, "ArrowLeft");
  assert.equal(demo.aria(crisis, "aria-checked"), "true");

  // Wrap-around from the last item back to the first.
  demo.key(crisis, "ArrowLeft");
  assert.equal(demo.aria(traffic, "aria-checked"), "true");

  // RTL: ArrowRight goes back.
  demo.key(traffic, "ArrowRight");
  assert.equal(demo.aria(crisis, "aria-checked"), "true");
});

test("Home and End jump to the first and last scenario", async () => {
  const demo = await loadDemo();
  const [traffic, , crisis] = demo.scenarioOptions;

  demo.key(traffic, "End");
  assert.equal(demo.aria(crisis, "aria-checked"), "true");
  assert.equal(demo.focused(), "scenario-crisis");

  demo.key(crisis, "Home");
  assert.equal(demo.aria(traffic, "aria-checked"), "true");
  assert.equal(demo.focused(), "scenario-traffic");
});

test("Enter and Space select the focused scenario", async () => {
  const demo = await loadDemo();
  const construction = demo.scenarioOptions[1];

  demo.key(construction, "Enter");
  assert.equal(demo.aria(construction, "aria-checked"), "true");

  demo.key(demo.scenarioOptions[0], " ");
  assert.equal(demo.aria(demo.scenarioOptions[0], "aria-checked"), "true");
});

test("scenario changes announce exactly one short sentence", async () => {
  const demo = await loadDemo();
  demo.click(demo.scenarioOptions[1]);
  assert.equal(demo.status.textContent, "سناریوی «بهسازی تقاطع و پروژه عمرانی» انتخاب شد.");
  assert.ok(demo.status.textContent.length < 80);
});

test("period buttons expose aria-pressed matching the selection", async () => {
  const demo = await loadDemo();
  const [now, today, week] = demo.periodButtons;

  demo.click(today);
  assert.equal(demo.aria(now, "aria-pressed"), "false");
  assert.equal(demo.aria(today, "aria-pressed"), "true");
  assert.equal(demo.aria(week, "aria-pressed"), "false");

  demo.click(week);
  assert.equal(demo.aria(today, "aria-pressed"), "false");
  assert.equal(demo.aria(week, "aria-pressed"), "true");
});

test("period changes announce exactly one short sentence", async () => {
  const demo = await loadDemo();
  demo.click(demo.periodButtons[2]);
  assert.equal(demo.status.textContent, "بازه زمانی به «روند هفتگی» تغییر کرد.");
});
