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
 * Loads assets/js/script.js against a minimal DOM stub and returns the
 * registered click handlers so the demo interactions can be driven headlessly.
 */
function makeElement(id = "") {
  const classes = new Set();
  return {
    id,
    textContent: "",
    className: "",
    dataset: {},
    addEventListener(type, fn) {
      this[`handler_${type}`] = fn;
    },
    setAttribute(name, value) {
      this[`attr_${name}`] = value;
    },
    classList: {
      toggle(name, force) {
        if (force === undefined) {
          classes.has(name) ? classes.delete(name) : classes.add(name);
        } else if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

async function loadScript() {
  const elements = new Map();
  const handlers = { scenario: new Map(), period: new Map(), links: [] };

  const scenarioOptions = ["traffic", "construction", "crisis"].map((name) => {
    const element = makeElement();
    element.dataset.scenario = name;
    element.addEventListener = (type, fn) => {
      if (type === "click") handlers.scenario.set(name, fn);
    };
    return element;
  });

  const periodButtons = ["now", "today", "week"].map((name) => {
    const element = makeElement();
    element.dataset.period = name;
    element.addEventListener = (type, fn) => {
      if (type === "click") handlers.period.set(name, fn);
    };
    return element;
  });

  const navLink = makeElement();
  navLink.getAttribute = () => "#problem";
  navLink.addEventListener = () => {};

  const maybeElement = () => {
    const element = makeElement();
    element.addEventListener = () => {};
    return element;
  };

  const mainNav = {
    ...makeElement(),
    querySelectorAll: () => [navLink],
  };

  // Simulate a served page so the loader takes the fetch path.
  globalThis.location = { protocol: "http:" };
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => JSON.parse(await readFile(new URL(`../${url}`, import.meta.url), "utf8")),
  });
  globalThis.window = {}; // no IntersectionObserver -> that block is skipped
  globalThis.document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    querySelector(selector) {
      if (selector === ".main-nav") return mainNav;
      if (selector === ".contact-form") return maybeElement();
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".scenario-option") return scenarioOptions;
      if (selector === ".period-button") return periodButtons;
      return [];
    },
  };

  await import(`../assets/js/script.js?cachebust=${nextImportId()}`);
  await waitForRender(elements);

  const click = (group, name) => {
    const handler = handlers[group].get(name);
    assert.ok(handler, `expected a click handler for ${group}:${name}`);
    handler();
  };

  return { click, elements, scenarioOptions, periodButtons };
}

test("after load, the default scenario and period are rendered from data", async () => {
  const { elements } = await loadScript();

  // The loader resolves, then the default entries are applied — so the DOM
  // reflects assets/data/*.json rather than staying on static markup.
  assert.equal(elements.get("scenarioName").textContent, "تغییر مسیر محور مرکزی");
  assert.equal(elements.get("travelValue").textContent, "−۱۲٪");
  assert.equal(elements.get("dashboardPeriod").textContent, "وضعیت اکنون");
  assert.equal(elements.get("trafficStatus").textContent, "روان");
});

test("each scenario renders the same Persian copy as before the refactor", async () => {
  const { click, elements } = await loadScript();

  const expected = {
    traffic: {
      name: "تغییر مسیر محور مرکزی",
      scope: "منطقه ۶ · ساعات اوج تردد",
      travel: "−۱۲٪",
      travelNote: "بهبود در محور هدف",
      service: "+۸٪",
      serviceNote: "پوشش مسیرهای اضطراری",
      energy: "−۵٪",
      energyNote: "کاهش توقف خودروها",
      decision: "قابل بررسی برای اجرای آزمایشی",
    },
    construction: {
      name: "بهسازی تقاطع و پروژه عمرانی",
      scope: "منطقه ۳ · برنامه اجرایی ۸ هفته‌ای",
      travel: "+۷٪",
      travelNote: "افزایش موقت زمان سفر",
      service: "−۳٪",
      serviceNote: "نیازمند مسیر جایگزین خدمات",
      energy: "+۲٪",
      energyNote: "مصرف بالاتر در مسیرهای فرعی",
      decision: "نیازمند برنامه کاهش اثر اجرا",
    },
    crisis: {
      name: "واکنش به آب‌گرفتگی محدوده‌ای",
      scope: "حوضه جنوبی · بارش شدید",
      travel: "−۱۸٪",
      travelNote: "کاهش انسداد با مسیرهای جایگزین",
      service: "+۱۴٪",
      serviceNote: "دسترسی سریع‌تر امداد",
      energy: "−۴٪",
      energyNote: "بهینه‌سازی عملیات میدانی",
      decision: "اولویت بالا برای آمادگی عملیاتی",
    },
  };

  for (const [key, fields] of Object.entries(expected)) {
    click("scenario", key);
    assert.equal(elements.get("scenarioName").textContent, fields.name, `${key}.name`);
    assert.equal(elements.get("scenarioScope").textContent, fields.scope, `${key}.scope`);
    assert.equal(elements.get("travelValue").textContent, fields.travel, `${key}.travel`);
    assert.equal(elements.get("travelNote").textContent, fields.travelNote, `${key}.travelNote`);
    assert.equal(elements.get("serviceValue").textContent, fields.service, `${key}.service`);
    assert.equal(elements.get("serviceNote").textContent, fields.serviceNote, `${key}.serviceNote`);
    assert.equal(elements.get("energyValue").textContent, fields.energy, `${key}.energy`);
    assert.equal(elements.get("energyNote").textContent, fields.energyNote, `${key}.energyNote`);
    assert.equal(elements.get("decisionValue").textContent, fields.decision, `${key}.decision`);
  }
});

test("scenario selection updates aria-checked and the selected class", async () => {
  const { click, scenarioOptions } = await loadScript();

  click("scenario", "crisis");

  const byName = Object.fromEntries(scenarioOptions.map((option) => [option.dataset.scenario, option]));
  assert.equal(byName.crisis.getAttribute?.("aria-checked"), undefined);
  assert.equal(byName.crisis["attr_aria-checked"], "true");
  assert.equal(byName.traffic["attr_aria-checked"], "false");
  assert.equal(byName.construction["attr_aria-checked"], "false");
  assert.ok(byName.crisis.classList.contains("is-selected"));
  assert.equal(byName.traffic.classList.contains("is-selected"), false);

  click("scenario", "traffic");
  assert.equal(byName.traffic["attr_aria-checked"], "true");
  assert.equal(byName.crisis["attr_aria-checked"], "false");
  assert.ok(byName.traffic.classList.contains("is-selected"));
  assert.equal(byName.crisis.classList.contains("is-selected"), false);
});

test("each dashboard period renders the same Persian copy and badge classes", async () => {
  const { click, elements } = await loadScript();

  const expected = {
    now: {
      period: "وضعیت اکنون",
      priority: "پایش ترافیک کریدور شمالی",
      priorityNote: "سطح توجه: متوسط",
      trafficStatus: "روان",
      trafficDetail: "۸۶٪ ظرفیت شبکه",
      trafficState: "پایدار",
      trafficClass: "good",
      energyStatus: "متوازن",
      energyDetail: "۲٪ کمتر از الگوی مرجع",
      energyState: "بهینه",
      energyClass: "good",
      incidentStatus: "۳ مورد",
      incidentDetail: "بدون رخداد بحرانی",
      incidentState: "پایش",
      incidentClass: "watch",
    },
    today: {
      period: "جمع‌بندی امروز",
      priority: "رسیدگی به تراکم عصرگاهی مرکز شهر",
      priorityNote: "سطح توجه: بالا",
      trafficStatus: "متغیر",
      trafficDetail: "۷۹٪ ظرفیت میانگین",
      trafficState: "توجه",
      trafficClass: "watch",
      energyStatus: "متعادل",
      energyDetail: "۱٪ بیشتر از الگوی مرجع",
      energyState: "پایش",
      energyClass: "watch",
      incidentStatus: "۹ مورد",
      incidentDetail: "۱ مورد در حال رسیدگی",
      incidentState: "فعال",
      incidentClass: "watch",
    },
    week: {
      period: "روند هفتگی",
      priority: "بهینه‌سازی الگوی تردد ساعات اوج",
      priorityNote: "فرصت بهبود: ۳ محور",
      trafficStatus: "رو به بهبود",
      trafficDetail: "۶٪ کاهش تأخیر نسبت به هفته قبل",
      trafficState: "مثبت",
      trafficClass: "good",
      energyStatus: "بهینه",
      energyDetail: "۴٪ کاهش نسبت به هفته قبل",
      energyState: "مثبت",
      energyClass: "good",
      incidentStatus: "۲۱ مورد",
      incidentDetail: "۸۷٪ حل‌شده در زمان هدف",
      incidentState: "کنترل‌شده",
      incidentClass: "good",
    },
  };

  for (const [key, fields] of Object.entries(expected)) {
    click("period", key);
    assert.equal(elements.get("dashboardPeriod").textContent, fields.period, `${key}.period`);
    assert.equal(elements.get("priorityValue").textContent, fields.priority, `${key}.priority`);
    assert.equal(elements.get("priorityNote").textContent, fields.priorityNote, `${key}.priorityNote`);

    for (const metric of ["traffic", "energy", "incident"]) {
      assert.equal(
        elements.get(`${metric}Status`).textContent,
        fields[`${metric}Status`],
        `${key}.${metric}Status`
      );
      assert.equal(
        elements.get(`${metric}Detail`).textContent,
        fields[`${metric}Detail`],
        `${key}.${metric}Detail`
      );
      assert.equal(
        elements.get(`${metric}State`).textContent,
        fields[`${metric}State`],
        `${key}.${metric}State`
      );
      assert.equal(
        elements.get(`${metric}State`).className,
        `metric-state ${fields[`${metric}Class`]}`,
        `${key}.${metric}Class`
      );
    }
  }
});
