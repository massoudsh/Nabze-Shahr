/**
 * Loads and validates demo content.
 *
 * Content lives in `assets/data/*.json` so a sales demo can be localized per
 * prospect without touching application code. When the page is opened from
 * `file://` (or `fetch` fails) the inline defaults below are used instead, so
 * the page never renders half a card or `undefined`.
 *
 * @module data
 */

const STATE_CLASSES = new Set(["good", "watch"]);

/** @returns {string[]} */
function requireKeys(object, keys, where) {
  const errors = [];
  for (const key of keys) {
    if (object == null || !(key in object)) errors.push(`${where}: missing "${key}"`);
  }
  return errors;
}

/**
 * Validate the scenario document.
 * @returns {string[]} errors, empty when valid
 */
export function validateScenarios(data) {
  const errors = requireKeys(data, ["default", "items"], "scenarios");
  if (errors.length) return errors;

  const keys = Object.keys(data.items ?? {});
  if (keys.length === 0) errors.push("scenarios.items: must not be empty");
  if (!keys.includes(data.default)) errors.push(`scenarios.default: "${data.default}" is not an item`);

  const required = ["name", "scope", "travel", "travelNote", "service", "serviceNote", "energy", "energyNote", "decision"];
  for (const key of keys) {
    const item = data.items[key];
    errors.push(...requireKeys(item, required, `scenarios.items.${key}`));
    for (const metric of ["travel", "service", "energy"]) {
      if (item?.[metric] && !Number.isFinite(item[metric].delta)) {
        errors.push(`scenarios.items.${key}.${metric}.delta: must be a number`);
      }
    }
    if (item?.scope && !("template" in item.scope)) {
      errors.push(`scenarios.items.${key}.scope: missing "template"`);
    }
  }

  return errors;
}

/**
 * Validate the dashboard document.
 * @returns {string[]} errors, empty when valid
 */
export function validateDashboard(data) {
  const errors = requireKeys(data, ["default", "items"], "dashboard");
  if (errors.length) return errors;

  const keys = Object.keys(data.items ?? {});
  if (keys.length === 0) errors.push("dashboard.items: must not be empty");
  if (!keys.includes(data.default)) errors.push(`dashboard.default: "${data.default}" is not an item`);

  for (const key of keys) {
    const item = data.items[key];
    errors.push(...requireKeys(item, ["period", "priority", "priorityNote", "traffic", "energy", "incident"], `dashboard.items.${key}`));

    for (const metric of ["traffic", "energy", "incident"]) {
      const entry = item?.[metric];
      if (!entry) continue;
      errors.push(...requireKeys(entry, ["status", "detail", "state", "stateClass"], `dashboard.items.${key}.${metric}`));
      if (entry.stateClass && !STATE_CLASSES.has(entry.stateClass)) {
        errors.push(`dashboard.items.${key}.${metric}.stateClass: must be "good" or "watch"`);
      }
    }
  }

  return errors;
}

/** Minimum content the page needs when `fetch` is unavailable. */
const FALLBACK_SCENARIOS = {
  default: "traffic",
  items: {
    traffic: {
      name: "تغییر مسیر محور مرکزی",
      scope: { template: "منطقه {} · ساعات اوج تردد", values: [6] },
      travel: { delta: -12 }, travelNote: "بهبود در محور هدف",
      service: { delta: 8 }, serviceNote: "پوشش مسیرهای اضطراری",
      energy: { delta: -5 }, energyNote: "کاهش توقف خودروها",
      decision: "قابل بررسی برای اجرای آزمایشی"
    }
  }
};

const FALLBACK_DASHBOARD = {
  default: "now",
  items: {
    now: {
      period: "وضعیت اکنون",
      priority: "پایش ترافیک کریدور شمالی",
      priorityNote: { text: "سطح توجه: متوسط" },
      traffic: { status: { text: "روان" }, detail: { percent: 86, text: "ظرفیت شبکه" }, state: "پایدار", stateClass: "good" },
      energy: { status: { text: "متوازن" }, detail: { percent: 2, text: "کمتر از الگوی مرجع" }, state: "بهینه", stateClass: "good" },
      incident: { status: { count: 3, text: "مورد" }, detail: { text: "بدون رخداد بحرانی" }, state: "پایش", stateClass: "watch" }
    }
  }
};

/**
 * Load one JSON document:
 *  1. skip `fetch` entirely on `file://`,
 *  2. otherwise fetch and validate,
 *  3. fall back to the inline default on any failure.
 *
 * @param {string} url
 * @param {(data: any) => string[]} validate
 * @param {any} fallback
 * @returns {Promise<{data: any, source: "network"|"fallback"}>}
 */
async function loadJson(url, validate, fallback) {
  const isFile = typeof location !== "undefined" && location.protocol === "file:";
  if (!isFile && typeof fetch === "function") {
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (response.ok) {
        const data = await response.json();
        const errors = validate(data);
        if (errors.length === 0) return { data, source: "network" };
        console.warn(`${url}: ignoring invalid data`, errors);
      }
    } catch {
      // Network or parse failure: use the fallback below.
    }
  }
  return { data: fallback, source: "fallback" };
}

export const loadScenarios = () =>
  loadJson("assets/data/scenarios.json", validateScenarios, FALLBACK_SCENARIOS);

export const loadDashboard = () =>
  loadJson("assets/data/dashboard.json", validateDashboard, FALLBACK_DASHBOARD);

export const fallbacks = { scenarios: FALLBACK_SCENARIOS, dashboard: FALLBACK_DASHBOARD };
