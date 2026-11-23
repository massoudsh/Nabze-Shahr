import test from "node:test";
import assert from "node:assert/strict";

/**
 * Headless harness for the lead form: builds the elements `script.js` expects,
 * wires the submit handler, and exposes helpers to fill and submit.
 */
async function loadLeadForm() {
  const attrs = new Map();
  const listeners = new Map();

  const makeElement = (id = "") => {
    const element = {
      id,
      value: "",
      checked: false,
      disabled: false,
      hidden: false,
      textContent: "",
      className: "",
      dataset: {},
      focused: false,
      setAttribute(name, value) {
        attrs.set(`${id}:${name}`, value);
      },
      getAttribute(name) {
        return attrs.get(`${id}:${name}`) ?? null;
      },
      removeAttribute(name) {
        attrs.delete(`${id}:${name}`);
      },
      addEventListener(type, fn) {
        listeners.set(`${id}:${type}`, fn);
      },
      focus() {
        this.focused = true;
        globalThis.__focusedId = id;
      },
      querySelector(selector) {
        if (selector === 'button[type="submit"]') return submitButton;
        if (selector === '[aria-invalid="true"]') {
          for (const [key, value] of attrs) {
            if (key.startsWith(`${id}:aria-invalid`) && value === "true") return element;
          }
          return null;
        }
        return null;
      },
      querySelectorAll: () => [],
      reset() {
        this.resetCalled = true;
      },
    };
    return element;
  };

  const submitButton = makeElement("submitButton");

  const ids = [
    "leadForm", "leadStatus", "leadName", "leadNameError", "leadOrganization",
    "leadOrganizationError", "leadRole", "leadRoleError", "leadMobile",
    "leadMobileError", "leadEmail", "leadEmailError", "leadPhone",
    "leadPhoneError", "leadMessage", "leadMessageError", "leadConsent",
    "leadConsentError", "leadWebsite",
  ];

  const elements = new Map(ids.map((id) => [id, makeElement(id)]));
  elements.set("submitButton", submitButton);
  const leadForm = elements.get("leadForm");
  leadForm.querySelector = (selector) => {
    if (selector === 'button[type="submit"]') return submitButton;
    if (selector === '[aria-invalid="true"]') {
      for (const id of ids) {
        const element = elements.get(id);
        if (attrs.get(`${id}:aria-invalid`) === "true") return element;
      }
    }
    return null;
  };

  globalThis.window = { setTimeout };
  globalThis.document = {
    getElementById: (id) => elements.get(id) ?? makeElement(id),
    querySelector: () => null,
    querySelectorAll: () => [],
  };

  await import(`../assets/js/script.js?leadform=${Date.now()}`);

  const submit = async () => {
    const handler = listeners.get("leadForm:submit");
    assert.ok(handler, "expected a submit handler on #leadForm");
    await handler({ preventDefault() {} });
  };

  const fill = (values) => {
    for (const [id, value] of Object.entries(values)) {
      const element = elements.get(id);
      assert.ok(element, `unknown field ${id}`);
      if (id === "leadConsent") element.checked = value;
      else element.value = value;
    }
  };

  return { elements, submit, fill, attrs };
}

const validInput = {
  leadName: "سارا محمدی",
  leadOrganization: "شهرداری منطقه ۶",
  leadRole: "مدیر فناوری اطلاعات",
  leadMobile: "۰۹۱۲۳۴۵۶۷۸۹",
  leadEmail: "",
  leadPhone: "",
  leadMessage: "",
  leadConsent: true,
};

test("invalid submit marks fields, shows Persian errors, and focuses the first one", async () => {
  const { elements, submit, fill, attrs } = await loadLeadForm();

  fill({ leadName: "", leadOrganization: "", leadMobile: "0812345678", leadConsent: false });
  await submit();

  assert.equal(attrs.get("leadName:aria-invalid"), "true");
  assert.equal(attrs.get("leadOrganization:aria-invalid"), "true");
  assert.equal(attrs.get("leadMobile:aria-invalid"), "true");
  assert.equal(attrs.get("leadConsent:aria-invalid"), "true");
  assert.equal(elements.get("leadNameError").hidden, false);
  assert.match(elements.get("leadNameError").textContent, /نام/);
  assert.match(elements.get("leadMobileError").textContent, /موبایل/);
  assert.match(elements.get("leadConsentError").textContent, /موافقت/);
  assert.equal(globalThis.__focusedId, "leadName", "first invalid field should receive focus");
  assert.equal(elements.get("leadStatus").textContent, "");
});

test("a valid submit clears errors, announces success, and resets the form", async () => {
  const { elements, submit, fill, attrs } = await loadLeadForm();

  fill(validInput);
  await submit();

  assert.equal(elements.get("leadStatus").textContent.includes("کارشناس ما"), true);
  assert.equal(elements.get("leadForm").resetCalled, true);
  assert.equal(elements.get("submitButton").disabled, false, "button must be re-enabled");
  assert.equal(attrs.get("leadName:aria-invalid"), "false");
  assert.equal(elements.get("leadNameError").hidden, true);
});

test("the honeypot short-circuits without validating the rest of the form", async () => {
  const { elements, submit, fill } = await loadLeadForm();

  fill({ ...validInput, leadWebsite: "http://spam.example" });
  await submit();

  assert.equal(elements.get("leadStatus").textContent, "درخواست شما ثبت شد.");
  assert.equal(elements.get("leadForm").resetCalled, true);
});

test("all three Iranian mobile formats pass validation", async () => {
  for (const mobile of ["09123456789", "۰۹۱۲۳۴۵۶۷۸۹", "+989123456789"]) {
    const { elements, submit, fill, attrs } = await loadLeadForm();
    fill({ ...validInput, leadMobile: mobile });
    await submit();
    assert.equal(attrs.get("leadMobile:aria-invalid"), "false", `${mobile} should be accepted`);
    assert.equal(elements.get("leadStatus").textContent.includes("ثبت شد"), true);
  }
});

