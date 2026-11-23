#!/usr/bin/env node
/**
 * Minimal, dependency-free validator for the adapter contract.
 *
 * It implements only the subset of JSON Schema this project actually uses
 * (type, required, enum, pattern, minLength, minItems, additionalProperties,
 * and the interval/cadence conditional), so the contract can be checked
 * without adding an npm dependency.
 *
 * Usage: node scripts/validate-adapter.mjs [file ...]
 */
import { readFile } from "node:fs/promises";

/** @returns {string[]} list of human-readable errors */
export function validateAdapter(adapter, schema) {
  const errors = [];

  if (!isPlainObject(adapter)) return ["adapter: expected an object"];

  const { properties = {}, required = [], additionalProperties } = schema;

  for (const key of required) {
    if (!(key in adapter)) errors.push(`${key}: required property is missing`);
  }

  for (const [key, value] of Object.entries(adapter)) {
    const rule = properties[key];
    if (!rule) {
      if (additionalProperties === false) errors.push(`${key}: unknown property`);
      continue;
    }
    errors.push(...checkValue(`${key}`, value, rule));
  }

  // cadence.mode === "interval" requires cadence.seconds
  if (adapter.cadence && isPlainObject(adapter.cadence)) {
    if (adapter.cadence.mode === "interval" && !("seconds" in adapter.cadence)) {
      errors.push("cadence.seconds: required when cadence.mode is 'interval'");
    }
  }

  return errors;
}

function checkValue(path, value, rule) {
  const errors = [];

  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${path}: must be one of ${rule.enum.join(", ")} (got ${JSON.stringify(value)})`);
    return errors;
  }

  if (rule.type) {
    const ok = matchesType(value, rule.type);
    if (!ok) {
      errors.push(`${path}: expected ${rule.type}, got ${describe(value)}`);
      return errors;
    }
  }

  if (typeof value === "string") {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push(`${path}: must be at least ${rule.minLength} characters`);
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors.push(`${path}: must be at most ${rule.maxLength} characters`);
    }
    if (rule.pattern && !new RegExp(rule.pattern, "u").test(value)) {
      errors.push(`${path}: does not match ${rule.pattern}`);
    }
  }

  if (typeof value === "number" && rule.minimum !== undefined && value < rule.minimum) {
    errors.push(`${path}: must be ≥ ${rule.minimum}`);
  }

  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) {
      errors.push(`${path}: must contain at least ${rule.minItems} item(s)`);
    }
    if (rule.items) {
      value.forEach((item, index) => {
        errors.push(...checkValue(`${path}[${index}]`, item, rule.items));
      });
    }
  }

  if (isPlainObject(value) && rule.properties) {
    for (const key of rule.required ?? []) {
      if (!(key in value)) errors.push(`${path}.${key}: required property is missing`);
    }
    for (const [key, child] of Object.entries(value)) {
      const childRule = rule.properties[key];
      if (!childRule) {
        if (rule.additionalProperties === false) errors.push(`${path}.${key}: unknown property`);
        continue;
      }
      errors.push(...checkValue(`${path}.${key}`, child, childRule));
    }
  }

  return errors;
}

function matchesType(value, type) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return isPlainObject(value);
    default:
      return false;
  }
}

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// CLI entry point
const files = process.argv.slice(2);
if (files.length > 0) {
  const schema = JSON.parse(await readFile(new URL("../docs/adapter.schema.json", import.meta.url)));
  let failed = false;

  for (const file of files) {
    const adapter = JSON.parse(await readFile(file, "utf8"));
    const errors = validateAdapter(adapter, schema);
    if (errors.length > 0) {
      failed = true;
      console.error(`✗ ${file}`);
      errors.forEach((error) => console.error(`  - ${error}`));
    } else {
      console.log(`✓ ${file}`);
    }
  }

  process.exit(failed ? 1 : 0);
}
