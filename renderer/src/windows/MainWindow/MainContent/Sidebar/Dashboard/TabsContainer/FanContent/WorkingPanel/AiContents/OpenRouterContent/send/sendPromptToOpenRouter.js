const DEFAULT_MODEL = "openai/gpt-oss-120b:free";

export async function sendPromptToOpenRouter({ textValue, apiKey, model = DEFAULT_MODEL }) {
  if (!apiKey) {
    throw new Error("OPEN_ROUTER_API_KEY is not configured");
  }

  if (!textValue || !textValue.trim()) {
    throw new Error("Prompt is empty");
  }

  const normalizedModel = model.replace(/^models\//, "");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // "HTTP-Referer": "https://your-site.com",
      // "X-Title": "Your App Name",
    },
    body: JSON.stringify({
      model: normalizedModel,  // ✅ 修正: modelフィールド名を使用
      messages: [
        {
          role: "system",
          content:
            "あなたは日本語の文章整形アシスタントです。箇条書きの意味を変えず、情報を追加せず、自然な1つの日本語文に整えてください。出力は文章のみ。",
        },
        {
          role: "user",
          content: `次の箇条書きを1つの自然な日本語文にしてください。\n\n${textValue}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  });

  // ✅ 修正: response.json()を先に呼び出す
  const data = await response.json();

  console.log('APIのレスポンス結果',data);

  if (!response.ok) {
    console.error(data);
    throw new Error(data?.error?.message ?? "OpenRouter API error");
  }

  // ✅ 修正: OpenRouterの正しいレスポンス形式
  const text = data?.choices?.[0]?.message?.content?.trim() || "";

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}