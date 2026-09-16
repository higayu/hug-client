import { formatFetchError } from './formatFetchError';

type ApiFetchResponse = {
  ok: boolean;
  status?: number;
  body?: unknown;
  error?: string;
};

/** Ollama / Gemini など Laravel 以外への HTTP リクエスト用 */
export async function fetchJson<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const requestOptions: RequestInit = { ...options, headers };

  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const response = (await chrome.runtime.sendMessage({
      type: 'api-fetch',
      url,
      options: requestOptions,
    })) as ApiFetchResponse;
    if (!response?.ok) {
      throw new Error(formatFetchError({ ...response, url }));
    }
    return response.body as T;
  }

  const res = await fetch(url, requestOptions);
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new Error(
      formatFetchError({
        ok: false,
        status: res.status,
        error: (body as { error?: string })?.error,
        body,
        url,
      }),
    );
  }
  return res.json() as Promise<T>;
}
