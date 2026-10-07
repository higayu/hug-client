function getByPath(source, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => (value == null ? undefined : value[key]), source);
}

export function resolveTemplateString(value, context = {}) {
  if (typeof value !== "string") return value;

  const exact = value.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
  if (exact) {
    const resolved = getByPath(context, exact[1].trim());
    return resolved === undefined ? value : resolved;
  }

  return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, path) => {
    const resolved = getByPath(context, path.trim());
    if (resolved === undefined || resolved === null) return "";
    if (typeof resolved === "object") return JSON.stringify(resolved);
    return String(resolved);
  });
}

export function resolveTemplates(value, context = {}) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplates(item, context));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveTemplates(item, context),
      ])
    );
  }

  return resolveTemplateString(value, context);
}

export { getByPath };
