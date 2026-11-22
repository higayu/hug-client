export const AUTH_STORAGE_KEY = 'hug_bansou_navi_auth';

export type AuthUser = {
  user_id: number;
  name: string;
  email: string;
  role: string;
};

export type StoredAuth = {
  access_token: string;
  user: AuthUser;
};

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.access_token || !parsed?.user?.user_id) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}