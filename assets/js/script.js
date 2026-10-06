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

// فرم تماس (فعلاً بدون backend — فقط پیام تایید)
const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    contactForm.innerHTML = '<p style="color:#22d3ee;font-weight:600;">درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.</p>';
  });
}
