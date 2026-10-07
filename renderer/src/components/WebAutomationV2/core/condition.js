import { getByPath, resolveTemplates } from "./templateResolver.js";

function compare(operator, actual, expected) {
  switch (operator) {
    case "equals":
    case "eq":
      return actual === expected || String(actual) === String(expected);
    case "not_equals":
    case "neq":
      return !(actual === expected || String(actual) === String(expected));
    case "truthy":
      return Boolean(actual);
    case "falsy":
      return !actual;
    case "exists":
      return actual !== undefined && actual !== null;
    case "not_exists":
      return actual === undefined || actual === null;
    case "in":
      return Array.isArray(expected) && expected.some((v) => String(v) === String(actual));
    default:
      return Boolean(actual);
  }
}

export function evaluateCondition(condition, context = {}) {
  if (!condition || (typeof condition === "object" && Object.keys(condition).length === 0)) {
    return true;
  }

  const resolved = resolveTemplates(condition, context);

  if (Array.isArray(resolved.all)) {
    return resolved.all.every((item) => evaluateCondition(item, context));
  }

  if (Array.isArray(resolved.any)) {
    return resolved.any.some((item) => evaluateCondition(item, context));
  }

  if (resolved.not) {
    return !evaluateCondition(resolved.not, context);
  }

  const path = resolved.path || resolved.variable || resolved.key;
  const operator = resolved.operator || resolved.op || "truthy";
  const actual = path ? getByPath(context, path) : resolved.actual;
  const expected = resolved.value ?? resolved.expected;

  return compare(operator, actual, expected);
}
