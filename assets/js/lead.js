/**
 * Lead-form validation for the demo-request form.
 *
 * Pure functions only: the DOM wiring lives in `script.js` so the rules can be
 * unit-tested without a browser.
 *
 * @module lead
 */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Normalize Persian/Arabic digits to ASCII and strip spaces, dashes, and
 * parentheses so a pasted number can be validated.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[\s‌\-().]/g, "");
}

/**
 * Normalize an Iranian mobile number to the canonical `09XXXXXXXXX` form.
 * Accepts `09…`, `9…`, `+989…`, `00989…`, and the same with Persian digits.
 *
 * @param {string} value
 * @returns {string|null} Canonical form, or `null` when not a valid mobile.
 */
export function normalizeMobile(value) {
  const digits = normalizeDigits(value);
  if (!digits) return null;

  let local = digits;
  if (/^00989\d{9}$/.test(local)) local = `0${local.slice(4)}`;
  else if (/^\+?989\d{9}$/.test(local)) local = `0${local.replace(/^\+?98/, "")}`;
  else if (/^9\d{9}$/.test(local)) local = `0${local}`;

  return /^09\d{9}$/.test(local) ? local : null;
}

/**
 * Normalize an Iranian landline number to `0` + area code + number.
 * Accepts optional separators and a `+98` prefix; it does not validate that
 * the area code is in service.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeLandline(value) {
  const digits = normalizeDigits(value);
  if (!digits) return null;

  let local = digits;
  if (/^0098\d{10}$/.test(local)) local = `0${local.slice(4)}`;
  else if (/^\+?98\d{10}$/.test(local)) local = `0${local.replace(/^\+?98/, "")}`;

  // 09xxxxxxxxx is a mobile, not a landline.
  if (/^09\d{9}$/.test(local)) return null;

  return /^0[1-8]\d{9}$/.test(local) ? local : null;
}

/** Basic email shape check; deliberately permissive. */
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
}

/**
 * Validate the whole lead payload.
 *
 * @param {{
 *   fullName?: string,
 *   organization?: string,
 *   role?: string,
 *   mobile?: string,
 *   email?: string,
 *   phone?: string,
 *   message?: string,
 *   consent?: boolean,
 * }} input
 * @returns {{
 *   valid: boolean,
 *   errors: Record<string, string>,
 *   payload: object,
 * }}
 */
export function validateLead(input = {}) {
  const errors = {};

  const fullName = String(input.fullName ?? "").trim();
  const organization = String(input.organization ?? "").trim();
  const role = String(input.role ?? "").trim();
  const message = String(input.message ?? "").trim();
  const email = String(input.email ?? "").trim();
  const phone = String(input.phone ?? "").trim();

  if (fullName.length < 3) {
    errors.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
  }

  if (organization.length < 2) {
    errors.organization = "نام سازمان را وارد کنید.";
  }

  if (!normalizeMobile(input.mobile)) {
    errors.mobile = "شماره موبایل معتبر نیست؛ نمونه: ۰۹۱۲۳۴۵۶۷۸۹.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "ایمیل وارد‌شده معتبر نیست.";
  }

  if (phone && !normalizeLandline(phone)) {
    errors.phone = "شماره تلفن ثابت معتبر نیست؛ نمونه: ۰۲۱۱۲۳۴۵۶۷۸.";
  }

  if (message.length > 1000) {
    errors.message = "توضیح حداکثر ۱۰۰۰ کاراکتر است.";
  }

  if (input.consent !== true) {
    errors.consent = "برای ثبت درخواست، موافقت با تماس کارشناس لازم است.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    payload: {
      fullName,
      organization,
      role,
      mobile: normalizeMobile(input.mobile) ?? "",
      email,
      phone: phone ? normalizeLandline(phone) ?? "" : "",
      message,
      consent: true,
      submittedAt: new Date().toISOString(),
    },
  };
}
