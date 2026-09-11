const DEFAULT_MODEL = "gemini-3.5-flash";

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function extractText(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("") || ""
  );
}

async function readErrorMessage(response) {
  try {
    const data = await response.json();
    return data?.error?.message || `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(response) {
  const retryAfter = response.headers.get("Retry-After");

  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function getBackoffMs(attempt) {
  const baseMs = 700;
  const maxMs = 8000;
  const exponential = Math.min(maxMs, baseMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 300);

  return exponential + jitter;
}

async function fetchGeminiOnce({ textValue, apiKey, model, timeoutMs = 30000 }) {
  const normalizedModel = model.replace(/^models\//, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: textValue }],
            },
          ],
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const message = await readErrorMessage(response);
      const error = new Error(message);
      error.status = response.status;
      error.retryAfterMs = getRetryAfterMs(response);
      error.model = normalizedModel;
      throw error;
    }

    const data = await response.json();
    const text = extractText(data);

    if (!text) {
      const error = new Error("Gemini returned an empty response");
      error.model = normalizedModel;
      throw error;
    }

    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendPromptToGemini({
  textValue,
  apiKey,
  model = DEFAULT_MODEL,
  fallbackModels = FALLBACK_MODELS,
  maxRetries = 2,
  timeoutMs = 30000,
}) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!textValue || !textValue.trim()) {
    throw new Error("Prompt is empty");
  }

  const models = [
    model,
    ...fallbackModels,
  ]
    .filter(Boolean)
    .map((m) => m.replace(/^models\//, ""))
    .filter((m, index, array) => array.indexOf(m) === index);

  const errors = [];

  for (const currentModel of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await fetchGeminiOnce({
          textValue: textValue.trim(),
          apiKey,
          model: currentModel,
          timeoutMs,
        });
      } catch (error) {
        errors.push(error);

        const status = error?.status;
        const retryable = RETRYABLE_STATUS_CODES.has(status);

        if (!retryable || attempt === maxRetries) {
          break;
        }

        const delayMs = error.retryAfterMs ?? getBackoffMs(attempt);
        await sleep(delayMs);
      }
    }
  }

  const lastError = errors.at(-1);
  const triedModels = models.join(", ");

  throw new Error(
    `Gemini request failed after retries. Tried models: ${triedModels}. Last error: ${
      lastError?.message || "Unknown error"
    }`
  );
}