export const PREFS_STORAGE_KEY = 'hug_bansou_navi_moc_selection';

export type CorrectionPrefs = {
  facilityId?: number;
  childId?: number;
  targetDate?: string;
};

export type PeriodPrefs = {
  facilityId?: number;
  childId?: number;
  startDate?: string;
  endDate?: string;
};

export type StoredPrefs = {
  v?: number;
  correction?: CorrectionPrefs;
  chat?: PeriodPrefs;
  personalRecord?: PeriodPrefs;
  hugPersonalRecord?: PeriodPrefs;
};

export function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredPrefs;
  } catch (error) {
    console.warn('[prefs] localStorage の読み込みに失敗:', error);
    return {};
  }
}

