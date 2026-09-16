type ApiFetchResponse = {
  ok: boolean;
  status?: number;
  body?: unknown;
  error?: string;
  url?: string;
};

export function formatFetchError(response: ApiFetchResponse & { url?: string }): string {
  const status = response?.status;
  const body = response?.body;
  const url = response?.url || '';
  let bodyMsg =
    typeof body === 'object' && body !== null
      ? (body as { message?: string; error?: string; sqlMessage?: string }).message ||
        (body as { error?: string }).error ||
        (body as { sqlMessage?: string }).sqlMessage
      : typeof body === 'string'
        ? body
        : '';
  if (bodyMsg && bodyMsg.includes('<') && bodyMsg.includes('>')) {
    const plain = bodyMsg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    bodyMsg = plain || bodyMsg;
  }
  const msg = response?.error || bodyMsg || `HTTP ${status}`;

  if (/not allowed by cors/i.test(msg)) {
    return (
      'APIサーバーが Chrome 拡張機能からのリクエストを拒否しました (CORS)。\n' +
      'Laravel backend の CorsMiddleware で chrome-extension:// を許可しているか確認してください。'
    );
  }
  if (status === 403 && /11434|ollama/i.test(msg + url)) {
    return (
      'Ollama がリクエストを拒否しました (403)。\n' +
      'タスクバーの Ollama を終了し、環境変数 OLLAMA_ORIGINS=* を設定してから再起動してください。'
    );
  }
  if (status === 403) {
    return `アクセスが拒否されました (403): ${msg}`;
  }
  return msg;
}
