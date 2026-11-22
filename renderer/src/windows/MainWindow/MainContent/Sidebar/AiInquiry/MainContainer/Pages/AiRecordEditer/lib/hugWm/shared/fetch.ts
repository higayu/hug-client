export async function hugWmFetch(url: string, options: RequestInit = {}): Promise<string> {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const response = await chrome.runtime.sendMessage({
      type: 'api-fetch',
      url,
      options,
    });
    if (!response?.ok) {
      const err =
        response?.error ||
        (typeof response?.body === 'string' ? response.body : `HTTP ${response?.status}`);
      throw new Error(err);
    }
    return typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP取得エラー: ${res.status}`);
  }
  return res.text();
}

export async function hugWmFetchText(url: string): Promise<string> {
  return hugWmFetch(url, { method: 'GET', credentials: 'include' });
}
