// منوی موبایل
const navToggle = document.getElementById("navToggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("nav-open");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => mainNav.classList.remove("nav-open"));
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
