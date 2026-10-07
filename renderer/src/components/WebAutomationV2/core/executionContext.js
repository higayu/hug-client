export function createExecutionContext(input = {}, extra = {}) {
  return {
    ...input,
    input: { ...input },
    ...extra,
  };
}

export function setContextValue(context, key, value) {
  if (!key) return context;
  context[key] = value;
  return context;
}
