export async function sendPromptToOllama({ textValue, ollamaUrl, model }) {
  if (!ollamaUrl) {
    ollamaUrl = "http://localhost:11434/api/generate";
  }
  
  // Normalize URL
  let targetUrl = ollamaUrl.trim();
  // If it's just a base URL like http://localhost:11434, append /api/generate
  if (!targetUrl.includes("/api/")) {
    targetUrl = targetUrl.replace(/\/$/, "") + "/api/generate";
  }

  if (!textValue || !textValue.trim()) {
    throw new Error("Prompt is empty");
  }

  const isChatEndpoint = targetUrl.endsWith("/api/chat");
  const body = isChatEndpoint 
    ? {
        model: model,
        messages: [
          {
            role: "user",
            content: textValue,
          },
        ],
        stream: false,
      }
    : {
        model: model,
        prompt: textValue,
        stream: false,
      };

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = isChatEndpoint ? data?.message?.content : data?.response;

  if (!text) {
    throw new Error("Ollama returned an empty response");
  }

  return text;
}
