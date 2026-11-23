import { formatNumber, formatPercent } from "./format.js";
import { validateLead } from "./lead.js";

/**
 * Render a demo metric whose number is formatted at render time.
 *
 * Data never carries literal Persian digits: each field declares a numeric
 * value plus the words around it, and this function puts the two together.
 *
 * @param {{ percent?: number, count?: number, text?: string }} field
 * @returns {string}
 */
function renderMetric(field) {
  const text = (field.text || "").trim();
  if (Number.isFinite(field.percent)) {
    const percent = formatPercent(field.percent, { showSign: false });
    return text ? `${percent} ${text}` : percent;
  }
  if (Number.isFinite(field.count)) {
    const count = formatNumber(field.count);
    return text ? `${count} ${text}` : count;
  }
  return text;
}

/** Render a signed percentage such as the scenario impact values. */
function renderImpact(field) {
  return formatPercent(field.delta, { showSign: field.delta > 0 });
}

/**
 * Fill `{}` placeholders with Persian-formatted numbers, left to right.
 *
 * @param {string} template
 * @param {...number} values
 * @returns {string}
 */
function fill(template, ...values) {
  let index = 0;
  return template.replace(/\{\}/g, () => formatNumber(values[index++]));
}

// منوی موبایل
const navToggle = document.getElementById("navToggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle && mainNav) {
  navToggle.setAttribute("aria-expanded", "false");

  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// مشخص‌کردن بخش فعال در منو
if (mainNav && "IntersectionObserver" in window) {
  const links = new Map(
    [...mainNav.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        const active = links.get(entry.target.id);
        if (active) active.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  links.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

// شبیه‌ساز سناریوی نمایشی
const scenarioOptions = document.querySelectorAll(".scenario-option");
const scenarioElements = {
  name: document.getElementById("scenarioName"),
  scope: document.getElementById("scenarioScope"),
  travelValue: document.getElementById("travelValue"),
  travelNote: document.getElementById("travelNote"),
  serviceValue: document.getElementById("serviceValue"),
  serviceNote: document.getElementById("serviceNote"),
  energyValue: document.getElementById("energyValue"),
  energyNote: document.getElementById("energyNote"),
  decision: document.getElementById("decisionValue")
};
const scenarios = {
  traffic: {
    name: "تغییر مسیر محور مرکزی",
    scope: fill("منطقه {} · ساعات اوج تردد", 6),
    travel: { delta: -12 }, travelNote: "بهبود در محور هدف",
    service: { delta: 8 }, serviceNote: "پوشش مسیرهای اضطراری",
    energy: { delta: -5 }, energyNote: "کاهش توقف خودروها",
    decision: "قابل بررسی برای اجرای آزمایشی"
  },
  construction: {
    name: "بهسازی تقاطع و پروژه عمرانی",
    scope: fill("منطقه {} · برنامه اجرایی {} هفته‌ای", 3, 8),
    travel: { delta: 7 }, travelNote: "افزایش موقت زمان سفر",
    service: { delta: -3 }, serviceNote: "نیازمند مسیر جایگزین خدمات",
    energy: { delta: 2 }, energyNote: "مصرف بالاتر در مسیرهای فرعی",
    decision: "نیازمند برنامه کاهش اثر اجرا"
  },
  crisis: {
    name: "واکنش به آب‌گرفتگی محدوده‌ای",
    scope: "حوضه جنوبی · بارش شدید",
    travel: { delta: -18 }, travelNote: "کاهش انسداد با مسیرهای جایگزین",
    service: { delta: 14 }, serviceNote: "دسترسی سریع‌تر امداد",
    energy: { delta: -4 }, energyNote: "بهینه‌سازی عملیات میدانی",
    decision: "اولویت بالا برای آمادگی عملیاتی"
  }
};

scenarioOptions.forEach((option) => {
  option.addEventListener("click", () => {
    selectScenario(option);
  });
});

/**
 * Announce a single short sentence to screen readers.
 * @param {string} message
 */
function announce(message) {
  const status = document.getElementById("demoStatus");
  if (status) status.textContent = message;
}

function selectScenario(option) {
  const scenario = scenarios[option.dataset.scenario];
  if (!scenario) return;

  scenarioOptions.forEach((item) => {
    const selected = item === option;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-checked", String(selected));
    // Roving tabindex: only the selected radio is in the tab order.
    item.tabIndex = selected ? 0 : -1;
  });

  scenarioElements.name.textContent = scenario.name;
  scenarioElements.scope.textContent = scenario.scope;
  scenarioElements.travelValue.textContent = renderImpact(scenario.travel);
  scenarioElements.travelNote.textContent = scenario.travelNote;
  scenarioElements.serviceValue.textContent = renderImpact(scenario.service);
  scenarioElements.serviceNote.textContent = scenario.serviceNote;
  scenarioElements.energyValue.textContent = renderImpact(scenario.energy);
  scenarioElements.energyNote.textContent = scenario.energyNote;
  scenarioElements.decision.textContent = scenario.decision;

  announce(`سناریوی «${scenario.name}» انتخاب شد.`);
}

// Arrow/Home/End navigation, mirroring a native radio group in RTL.
scenarioOptions.forEach((option, index) => {
  option.addEventListener("keydown", (event) => {
    const last = scenarioOptions.length - 1;
    let nextIndex = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = index === 0 ? last : index - 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = index === last ? 0 : index + 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = last;
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        selectScenario(option);
        return;
      default:
        return;
    }

    event.preventDefault();
    const next = scenarioOptions[nextIndex];
    selectScenario(next);
    next.focus();
  });
});

// بازه‌های نمایشی داشبورد
const periodButtons = document.querySelectorAll(".period-button");
const dashboardElements = {
  period: document.getElementById("dashboardPeriod"),
  priority: document.getElementById("priorityValue"),
  priorityNote: document.getElementById("priorityNote"),
  trafficStatus: document.getElementById("trafficStatus"),
  trafficDetail: document.getElementById("trafficDetail"),
  trafficState: document.getElementById("trafficState"),
  energyStatus: document.getElementById("energyStatus"),
  energyDetail: document.getElementById("energyDetail"),
  energyState: document.getElementById("energyState"),
  incidentStatus: document.getElementById("incidentStatus"),
  incidentDetail: document.getElementById("incidentDetail"),
  incidentState: document.getElementById("incidentState")
};
const dashboardPeriods = {
  now: {
    period: "وضعیت اکنون",
    priority: "پایش ترافیک کریدور شمالی", priorityNote: "سطح توجه: متوسط",
    traffic: { status: "روان", detail: { percent: 86, text: "ظرفیت شبکه" }, state: "پایدار", stateClass: "good" },
    energy: { status: "متوازن", detail: { percent: 2, text: "کمتر از الگوی مرجع" }, state: "بهینه", stateClass: "good" },
    incident: { status: { count: 3, text: "مورد" }, detail: { text: "بدون رخداد بحرانی" }, state: "پایش", stateClass: "watch" }
  },
  today: {
    period: "جمع‌بندی امروز",
    priority: "رسیدگی به تراکم عصرگاهی مرکز شهر", priorityNote: "سطح توجه: بالا",
    traffic: { status: "متغیر", detail: { percent: 79, text: "ظرفیت میانگین" }, state: "توجه", stateClass: "watch" },
    energy: { status: "متعادل", detail: { percent: 1, text: "بیشتر از الگوی مرجع" }, state: "پایش", stateClass: "watch" },
    incident: { status: { count: 9, text: "مورد" }, detail: { count: 1, text: "مورد در حال رسیدگی" }, state: "فعال", stateClass: "watch" }
  },
  week: {
    period: "روند هفتگی",
    priority: "بهینه‌سازی الگوی تردد ساعات اوج", priorityNote: fill("فرصت بهبود: {} محور", 3),
    traffic: { status: "رو به بهبود", detail: { percent: 6, text: "کاهش تأخیر نسبت به هفته قبل" }, state: "مثبت", stateClass: "good" },
    energy: { status: "بهینه", detail: { percent: 4, text: "کاهش نسبت به هفته قبل" }, state: "مثبت", stateClass: "good" },
    incident: { status: { count: 21, text: "مورد" }, detail: { percent: 87, text: "حل‌شده در زمان هدف" }, state: "کنترل‌شده", stateClass: "good" }
  }
};

const dashboardMetrics = ["traffic", "energy", "incident"];

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const period = dashboardPeriods[button.dataset.period];
    if (!period) return;

    periodButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    dashboardElements.period.textContent = period.period;
    dashboardElements.priority.textContent = period.priority;
    dashboardElements.priorityNote.textContent = period.priorityNote;

    dashboardMetrics.forEach((metric) => {
      const source = period[metric];
      const status = typeof source.status === "object" ? renderMetric(source.status) : source.status;
      dashboardElements[`${metric}Status`].textContent = status;
      dashboardElements[`${metric}Detail`].textContent = renderMetric(source.detail);
      dashboardElements[`${metric}State`].textContent = source.state;
      dashboardElements[`${metric}State`].className = `metric-state ${source.stateClass}`;
    });

    announce(`بازه زمانی به «${period.period}» تغییر کرد.`);
  });
});

// فرم درخواست دمو
const leadForm = document.getElementById("leadForm");

if (leadForm) {
  const statusElement = document.getElementById("leadStatus");
  const fieldMap = {
    fullName: { input: "leadName", error: "leadNameError" },
    organization: { input: "leadOrganization", error: "leadOrganizationError" },
    role: { input: "leadRole", error: "leadRoleError" },
    mobile: { input: "leadMobile", error: "leadMobileError" },
    email: { input: "leadEmail", error: "leadEmailError" },
    phone: { input: "leadPhone", error: "leadPhoneError" },
    message: { input: "leadMessage", error: "leadMessageError" },
    consent: { input: "leadConsent", error: "leadConsentError" }
  };

  const showError = (key, message) => {
    const field = fieldMap[key];
    if (!field) return;
    const input = document.getElementById(field.input);
    const error = document.getElementById(field.error);
    if (input) input.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) {
      error.textContent = message || "";
      error.hidden = !message;
    }
  };

  const clearErrors = () => Object.keys(fieldMap).forEach((key) => showError(key, ""));

  /**
   * Integration point for a real backend. Replace the body with a `fetch`
   * call to your endpoint; the contract is documented in docs/lead-payload.md.
   *
   * @param {object} payload
   * @returns {Promise<void>}
   */
  const submitLead = (payload) =>
    new Promise((resolve) => {
      // Default demo adapter: accepts the payload and resolves immediately.
      void payload;
      window.setTimeout(resolve, 400);
    });

  const readForm = () => ({
    fullName: document.getElementById("leadName").value,
    organization: document.getElementById("leadOrganization").value,
    role: document.getElementById("leadRole").value,
    mobile: document.getElementById("leadMobile").value,
    email: document.getElementById("leadEmail").value,
    phone: document.getElementById("leadPhone").value,
    message: document.getElementById("leadMessage").value,
    consent: document.getElementById("leadConsent").checked
  });

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    statusElement.textContent = "";

    // Honeypot: a real user never fills this, so pretend everything went fine.
    if (document.getElementById("leadWebsite").value.trim() !== "") {
      statusElement.textContent = "درخواست شما ثبت شد.";
      leadForm.reset();
      return;
    }

    const result = validateLead(readForm());
    if (!result.valid) {
      Object.entries(result.errors).forEach(([key, message]) => showError(key, message));
      const invalid = leadForm.querySelector('[aria-invalid="true"]');
      if (invalid) invalid.focus();
      return;
    }

    const submitButton = leadForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    statusElement.textContent = "در حال ثبت درخواست…";

    try {
      await submitLead(result.payload);
      leadForm.reset();
      statusElement.textContent =
        "درخواست شما ثبت شد. کارشناس ما در روزهای کاری برای هماهنگی جلسه تماس می‌گیرد.";
    } catch (error) {
      statusElement.textContent =
        "ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید یا با ایمیل info@nabzshahr.ir تماس بگیرید.";
    } finally {
      submitButton.disabled = false;
    }
  });
}
