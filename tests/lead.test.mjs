import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeDigits,
  normalizeMobile,
  normalizeLandline,
  isValidEmail,
  validateLead,
} from "../assets/js/lead.js";

test("normalizeDigits converts Persian and Arabic digits", () => {
  assert.equal(normalizeDigits("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  assert.equal(normalizeDigits("٠٩١٢٣٤٥٦٧٨٩"), "09123456789");
  assert.equal(normalizeDigits("۰۹۱۲ ۳۴۵ ۶۷۸۹"), "09123456789");
  assert.equal(normalizeDigits("(۰۲۱) ۱۲۳۴-۵۶۷۸"), "02112345678");
});

test("normalizeMobile accepts the three forms Iranian users type", () => {
  assert.equal(normalizeMobile("09123456789"), "09123456789");
  assert.equal(normalizeMobile("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  assert.equal(normalizeMobile("+989123456789"), "09123456789");
  assert.equal(normalizeMobile("00989123456789"), "09123456789");
  assert.equal(normalizeMobile("9123456789"), "09123456789");
  assert.equal(normalizeMobile("۰۹۱۲ ۳۴۵ ۶۷۸۹"), "09123456789");
});

test("normalizeMobile rejects landlines and malformed numbers", () => {
  for (const value of ["0812345678", "0912345", "091234567890", "abc", "", null]) {
    assert.equal(normalizeMobile(value), null, `expected null for ${String(value)}`);
  }
});

test("normalizeLandline accepts area-code numbers only", () => {
  assert.equal(normalizeLandline("02112345678"), "02112345678");
  assert.equal(normalizeLandline("۰۲۱ ۱۲۳۴ ۵۶۷۸"), "02112345678");
  assert.equal(normalizeLandline("+982112345678"), "02112345678");
  assert.equal(normalizeLandline("09123456789"), null);
});

test("isValidEmail is permissive but rejects obvious junk", () => {
  assert.equal(isValidEmail("dev@nabzshahr.ir"), true);
  assert.equal(isValidEmail("a.b+c@sub.example.ir"), true);
  for (const value of ["", "a@b", "no-at-sign", "@example.com", "a b@example.com"]) {
    assert.equal(isValidEmail(value), false, `expected invalid for ${value}`);
  }
});

const baseLead = {
  fullName: "سارا محمدی",
  organization: "شهرداری منطقه ۶",
  role: "مدیر فناوری اطلاعات",
  mobile: "۰۹۱۲۳۴۵۶۷۸۹",
  email: "",
  phone: "",
  message: "",
  consent: true,
};

test("validateLead accepts a complete lead and normalizes the mobile", () => {
  const result = validateLead(baseLead);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.equal(result.payload.mobile, "09123456789");
  assert.equal(result.payload.fullName, "سارا محمدی");
  assert.equal(result.payload.consent, true);
  assert.match(result.payload.submittedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("validateLead reports every invalid field at once", () => {
  const result = validateLead({
    fullName: "",
    organization: "",
    mobile: "0812345678",
    email: "bad",
    phone: "12345",
    consent: false,
  });

  assert.equal(result.valid, false);
  for (const key of ["fullName", "organization", "mobile", "email", "phone", "consent"]) {
    assert.ok(result.errors[key], `expected an error for ${key}`);
  }
});

test("validateLead treats optional fields as optional", () => {
  const result = validateLead({ ...baseLead, email: "", phone: "", role: "", message: "" });
  assert.equal(result.valid, true);
  assert.equal(result.payload.email, "");
  assert.equal(result.payload.phone, "");
});

test("validateLead rejects an over-long message", () => {
  const result = validateLead({ ...baseLead, message: "ا".repeat(1001) });
  assert.equal(result.valid, false);
  assert.ok(result.errors.message);
});

test("validateLead requires consent explicitly", () => {
  assert.equal(validateLead({ ...baseLead, consent: "yes" }).valid, false);
  assert.equal(validateLead({ ...baseLead, consent: undefined }).valid, false);
  assert.equal(validateLead({ ...baseLead, consent: true }).valid, true);
});
