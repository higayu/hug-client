import { executeFlowV2 } from "@/components/WebAutomationV2";

const SECRET_STORE_KEY = "__WEB_AUTOMATION_V2_AI_SECRET_INPUTS__";
const SENSITIVE_KEYS = new Set(["apiKey", "textValue", "prompt", "message"]);

function getSecretStore() {
  if (!(globalThis[SECRET_STORE_KEY] instanceof Map)) {
    globalThis[SECRET_STORE_KEY] = new Map();
  }
  return globalThis[SECRET_STORE_KEY];
}

function createSecretId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `ai-v2-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function splitRuntimeInput(input = {}) {
  const secret = {};
  const safe = {};

  for (const [key, value] of Object.entries(input || {})) {
    if (SENSITIVE_KEYS.has(key)) {
      secret[key] = value;
      safe[`${key}Meta`] = {
        length: value == null ? 0 : String(value).length,
      };
    } else {
      safe[key] = value;
    }
  }

  return { secret, safe };
}

/**
 * AI処理共通ブリッジ（WebAutomation V2）
 *
 * 各 sendPromptTo*.js の公開APIは変更せず、実処理だけを
 * DB管理の WebAutomation V2 Flow へ委譲する。
 *
 * APIキー / プロンプト本文はV2実行ログへ保存せず、
 * Rendererメモリ上の一時Storeから仮想JSへ受け渡す。
 *
 * 戻り値は旧実装と同じ:
 * - DeepSeek / ChatGPT: true
 * - Gemini / Ollama / OpenRouter / Laravel: 応答テキスト
 */
export async function executeAiAutomationFlow({
  flowKey,
  input = {},
  forceReloadFlow = false,
}) {
  if (!flowKey) {
    throw new Error("AI WebAutomation flowKey がありません");
  }

  void forceReloadFlow;

  const secretId = createSecretId();
  const store = getSecretStore();
  const { secret, safe } = splitRuntimeInput(input);

  store.set(secretId, secret);

  try {
    return await executeFlowV2(flowKey, {
      ...safe,
      __runtimeSecretKey: secretId,
    });
  } finally {
    store.delete(secretId);
  }
}
