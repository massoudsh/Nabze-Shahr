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
    scope: "منطقه ۶ · ساعات اوج تردد",
    travelValue: "−۱۲٪", travelNote: "بهبود در محور هدف",
    serviceValue: "+۸٪", serviceNote: "پوشش مسیرهای اضطراری",
    energyValue: "−۵٪", energyNote: "کاهش توقف خودروها",
    decision: "قابل بررسی برای اجرای آزمایشی"
  },
  construction: {
    name: "بهسازی تقاطع و پروژه عمرانی",
    scope: "منطقه ۳ · برنامه اجرایی ۸ هفته‌ای",
    travelValue: "+۷٪", travelNote: "افزایش موقت زمان سفر",
    serviceValue: "−۳٪", serviceNote: "نیازمند مسیر جایگزین خدمات",
    energyValue: "+۲٪", energyNote: "مصرف بالاتر در مسیرهای فرعی",
    decision: "نیازمند برنامه کاهش اثر اجرا"
  },
  crisis: {
    name: "واکنش به آب‌گرفتگی محدوده‌ای",
    scope: "حوضه جنوبی · بارش شدید",
    travelValue: "−۱۸٪", travelNote: "کاهش انسداد با مسیرهای جایگزین",
    serviceValue: "+۱۴٪", serviceNote: "دسترسی سریع‌تر امداد",
    energyValue: "−۴٪", energyNote: "بهینه‌سازی عملیات میدانی",
    decision: "اولویت بالا برای آمادگی عملیاتی"
  }
};

scenarioOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const scenario = scenarios[option.dataset.scenario];
    if (!scenario) return;

    scenarioOptions.forEach((item) => {
      item.classList.toggle("is-selected", item === option);
      item.setAttribute("aria-checked", String(item === option));
    });
    Object.entries(scenario).forEach(([key, value]) => {
      if (scenarioElements[key]) scenarioElements[key].textContent = value;
    });
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
    period: "وضعیت اکنون", priority: "پایش ترافیک کریدور شمالی", priorityNote: "سطح توجه: متوسط",
    trafficStatus: "روان", trafficDetail: "۸۶٪ ظرفیت شبکه", trafficState: "پایدار", trafficClass: "good",
    energyStatus: "متوازن", energyDetail: "۲٪ کمتر از الگوی مرجع", energyState: "بهینه", energyClass: "good",
    incidentStatus: "۳ مورد", incidentDetail: "بدون رخداد بحرانی", incidentState: "پایش", incidentClass: "watch"
  },
  today: {
    period: "جمع‌بندی امروز", priority: "رسیدگی به تراکم عصرگاهی مرکز شهر", priorityNote: "سطح توجه: بالا",
    trafficStatus: "متغیر", trafficDetail: "۷۹٪ ظرفیت میانگین", trafficState: "توجه", trafficClass: "watch",
    energyStatus: "متعادل", energyDetail: "۱٪ بیشتر از الگوی مرجع", energyState: "پایش", energyClass: "watch",
    incidentStatus: "۹ مورد", incidentDetail: "۱ مورد در حال رسیدگی", incidentState: "فعال", incidentClass: "watch"
  },
  week: {
    period: "روند هفتگی", priority: "بهینه‌سازی الگوی تردد ساعات اوج", priorityNote: "فرصت بهبود: ۳ محور",
    trafficStatus: "رو به بهبود", trafficDetail: "۶٪ کاهش تأخیر نسبت به هفته قبل", trafficState: "مثبت", trafficClass: "good",
    energyStatus: "بهینه", energyDetail: "۴٪ کاهش نسبت به هفته قبل", energyState: "مثبت", energyClass: "good",
    incidentStatus: "۲۱ مورد", incidentDetail: "۸۷٪ حل‌شده در زمان هدف", incidentState: "کنترل‌شده", incidentClass: "good"
  }
};

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const period = dashboardPeriods[button.dataset.period];
    if (!period) return;

    periodButtons.forEach((item) => item.classList.toggle("is-selected", item === button));
    Object.entries(period).forEach(([key, value]) => {
      if (!key.endsWith("Class") && dashboardElements[key]) dashboardElements[key].textContent = value;
    });
    ["traffic", "energy", "incident"].forEach((metric) => {
      const state = dashboardElements[`${metric}State`];
      state.className = `metric-state ${period[`${metric}Class`]}`;
    });
  });
});

// فرم تماس (فعلاً بدون backend — فقط پیام تایید)
const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    contactForm.innerHTML = '<p style="color:#22d3ee;font-weight:600;">درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.</p>';
  });
}
