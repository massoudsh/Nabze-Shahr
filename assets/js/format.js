/**
 * Persian formatting helpers for NabzShahr.
 *
 * Pure, dependency-free, and side-effect free. Everything the UI needs to
 * render Iranian numbers, dates, and amounts goes through here so digits,
 * separators, and calendars stay consistent across the page and any future
 * report.
 *
 * @module format
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const THOUSANDS = "٬";
const MINUS = "−"; // U+2212, matches the existing Persian copy
const INVALID = "—";

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const DEFAULT_TIME_ZONE = "Asia/Tehran";

/* ------------------------------------------------------------------ *
 * Digits and numbers
 * ------------------------------------------------------------------ */

/**
 * Convert ASCII digits to Persian digits, leaving every other character
 * (letters, spaces, separators, signs) untouched.
 *
 * @param {string|number} value
 * @returns {string}
 */
export function toPersianDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

/**
 * Format a number with Persian digits and the Persian thousands separator.
 * Returns {@link INVALID} for empty, NaN, or infinite input.
 *
 * @param {number|string} value
 * @param {{ maximumFractionDigits?: number }} [options]
 * @returns {string}
 */
export function formatNumber(value, options = {}) {
  const number = toFiniteNumber(value);
  if (number === null) return INVALID;

  const maximumFractionDigits = clampFractionDigits(options.maximumFractionDigits);
  const negative = number < 0;
  const absolute = Math.abs(number);

  const fixed = absolute.toFixed(maximumFractionDigits);
  const [integerPart, fractionPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS);

  const body = fractionPart ? `${grouped}.${fractionPart}` : grouped;
  return (negative ? MINUS : "") + toPersianDigits(body);
}

/**
 * Format an amount in Toman, e.g. `۱۲٬۴۵۰ تومان`.
 *
 * @param {number|string} value
 * @param {{ maximumFractionDigits?: number }} [options]
 * @returns {string}
 */
export function formatToman(value, options = {}) {
  const formatted = formatNumber(value, options);
  return formatted === INVALID ? INVALID : `${formatted} تومان`;
}

/**
 * Format a signed percentage, e.g. `+۸٪` or `−۱۲٪`.
 *
 * @param {number|string} value
 * @param {{ showSign?: boolean, maximumFractionDigits?: number }} [options]
 * @returns {string}
 */
export function formatPercent(value, options = {}) {
  const number = toFiniteNumber(value);
  if (number === null) return INVALID;

  const showSign = options.showSign !== false;
  const sign = number < 0 ? MINUS : showSign && number > 0 ? "+" : "";
  const magnitude = formatNumber(Math.abs(number), {
    maximumFractionDigits: options.maximumFractionDigits,
  });

  return magnitude === INVALID ? INVALID : `${sign}${magnitude}٪`;
}

/* ------------------------------------------------------------------ *
 * Jalali calendar
 * ------------------------------------------------------------------ */

// Jalaali-js style breakpoints for the 33-year leap cycle.
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

/** @returns {{ leap: number, gy: number, march: number }} */
function jalCal(jy, withoutLeap) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  let leap = -1;

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new RangeError(`Invalid Jalali year: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
  }

  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

const j2d = (jy, jm, jd) => {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
};

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** @returns {{ gy: number, gm: number, gd: number } | null} */
function gregorianParts(value, timeZone) {
  const date = toDate(value);
  if (!date) return null;

  if (timeZone === "UTC") {
    return {
      gy: date.getUTCFullYear(),
      gm: date.getUTCMonth() + 1,
      gd: date.getUTCDate(),
    };
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);

    const read = (type) => Number(parts.find((part) => part.type === type).value);
    return { gy: read("year"), gm: read("month"), gd: read("day") };
  } catch {
    return {
      gy: date.getFullYear(),
      gm: date.getMonth() + 1,
      gd: date.getDate(),
    };
  }
}

/**
 * Format a date as a Jalali (Solar Hijri) date.
 *
 * @param {Date|string|number} value Date object, ISO string, or epoch ms.
 * @param {"numeric"|"long"} [style] `numeric` → `۱۴۰۵/۰۹/۰۲`,
 *   `long` → `۲ آذر ۱۴۰۵`.
 * @param {{ timeZone?: string }} [options] Defaults to `Asia/Tehran`.
 * @returns {string}
 */
export function formatJalali(value, style = "numeric", options = {}) {
  const parts = gregorianParts(value, options.timeZone || DEFAULT_TIME_ZONE);
  if (!parts) return INVALID;

  let jalali;
  try {
    jalali = d2j(g2d(parts.gy, parts.gm, parts.gd));
  } catch {
    return INVALID;
  }

  const { jy, jm, jd } = jalali;
  if (!(jm >= 1 && jm <= 12) || !(jd >= 1 && jd <= 31)) return INVALID;

  if (style === "long") {
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
  }

  const pad = (n) => String(n).padStart(2, "0");
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

/**
 * Format a date relative to now, in Persian.
 *
 * @param {Date|string|number} value
 * @param {Date|string|number} [now] Defaults to `Date.now()`.
 * @param {{ timeZone?: string }} [options]
 * @returns {string}
 */
export function formatRelative(value, now, options = {}) {
  const target = toDate(value);
  const reference = toDate(now ?? Date.now());
  if (!target || !reference) return INVALID;

  const diffMs = target.getTime() - reference.getTime();
  const future = diffMs > 0;
  const absoluteMs = Math.abs(diffMs);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absoluteMs < minute) return "همین حالا";

  if (absoluteMs < hour) {
    const minutes = Math.floor(absoluteMs / minute);
    return future ? `${formatNumber(minutes)} دقیقه بعد` : `${formatNumber(minutes)} دقیقه پیش`;
  }

  if (absoluteMs < day) {
    const hours = Math.floor(absoluteMs / hour);
    return future ? `${formatNumber(hours)} ساعت بعد` : `${formatNumber(hours)} ساعت پیش`;
  }

  const days = Math.floor(absoluteMs / day);
  if (days === 1) return future ? "فردا" : "دیروز";
  if (days < 30) {
    return future ? `${formatNumber(days)} روز بعد` : `${formatNumber(days)} روز پیش`;
  }

  const monthDistance = Math.floor(days / 30);
  if (monthDistance < 12) {
    return future
      ? `${formatNumber(monthDistance)} ماه بعد`
      : `${formatNumber(monthDistance)} ماه پیش`;
  }

  return formatJalali(target, "long", options);
}

/* ------------------------------------------------------------------ *
 * Internal helpers
 * ------------------------------------------------------------------ */

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(number) ? number : null;
}

function clampFractionDigits(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(6, Math.max(0, Math.trunc(value)));
}

function toDate(value) {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
