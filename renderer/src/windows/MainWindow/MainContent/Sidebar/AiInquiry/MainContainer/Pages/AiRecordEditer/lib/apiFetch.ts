import { getApiBase } from './aiConfig';
import { clearStoredAuth, getStoredAuth } from './authStorage';
import { formatFetchError } from './formatFetchError';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

const AUTH_EXPIRED_EVENT_DEDUPE_MS = 1000;
let lastAuthExpiredEventAt = 0;

type ApiFetchResponse = {
  ok: boolean;
  status?: number;
  body?: unknown;
  error?: string;
};

export class ApiFetchError extends Error {
  status?: number;
  body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = 'ApiFetchError';
    this.status = status;
    this.body = body;
  }
}

function isAuthExpiredStatus(status?: number) {
  return status === 401 || status === 419;
}

function handleAuthExpired(status?: number, body?: unknown) {
  clearStoredAuth();

  const now = Date.now();
  if (now - lastAuthExpiredEventAt < AUTH_EXPIRED_EVENT_DEDUPE_MS) {
    return;
  }

  lastAuthExpiredEventAt = now;

  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: { status, body },
    }),
  );
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const base = getApiBase().replace(/\/$/, '');
  const normalizedPath = path.replace(/^\//, '');

  return `${base}/${normalizedPath}`;
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = buildApiUrl(path);
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const storedAuth = getStoredAuth();

  if (storedAuth?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${storedAuth.access_token}`);
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const response = (await chrome.runtime.sendMessage({
      type: 'api-fetch',
      url,
      options: requestOptions,
    })) as ApiFetchResponse;

    if (!response?.ok) {
      if (isAuthExpiredStatus(response?.status)) {
        handleAuthExpired(response.status, response.body);
      }

      throw new ApiFetchError(
        formatFetchError({ ...response, url }),
        response?.status,
        response?.body,
      );
    }

    return response.body as T;
  }

  const res = await fetch(url, requestOptions);
  const body = await parseResponseBody(res);

  if (!res.ok) {
    if (isAuthExpiredStatus(res.status)) {
      handleAuthExpired(res.status, body);
    }

    throw new ApiFetchError(
      formatFetchError({
        ok: false,
        status: res.status,
        error: (body as { error?: string })?.error,
        body,
        url,
      }),
      res.status,
      body,
    );
  }

  return body as T;
}
