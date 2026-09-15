function extractCorrectedText(result) {
  const data = result?.data ?? result;

  return (
    data?.message ??
    data?.data?.message ??
    ""
  );
}

export async function sendPromptToLaravelApi({
  prompt,
  message,
  promptKey = "personal",
}) {
  const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedPrompt) {
    throw new Error("Prompt is empty");
  }

  if (!normalizedMessage) {
    throw new Error("Message is empty");
  }

  let api;

  if (promptKey === "personal") {
    api = window.electronAPI?.laravel_aiRecordEditer_correctPersonalRecord;
  } else if (promptKey === "professional1") {
    api = window.electronAPI?.laravel_aiRecordEditer_correctProfessionalSupport;
  } else {
    throw new Error(`Unsupported Laravel AI prompt key: ${promptKey}`);
  }

  if (typeof api !== "function") {
    throw new Error("Laravel AI correction API is not available in preload");
  }

  const result = await api({
    prompt: normalizedPrompt,
    message: normalizedMessage,
  });

  if (!result?.success) {
    throw new Error(
      result?.message ||
        result?.error?.details?.message ||
        "Laravel AI correction request failed"
    );
  }

  const text = extractCorrectedText(result);

  if (!text || !String(text).trim()) {
    throw new Error("Laravel AI correction returned an empty response");
  }

  return String(text);
}
