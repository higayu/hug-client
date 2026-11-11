export const MEMO_AUTO_SAVE_MIN_SECONDS = 1;
export const MEMO_AUTO_SAVE_MAX_SECONDS = 300;
export const MEMO_AUTO_SAVE_DEFAULT_SECONDS = 3;

export function normalizeMemoAutoSaveInterval(value) {
  const seconds = typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')
    ? Number(value) : NaN;
  return Number.isFinite(seconds)
    ? Math.min(MEMO_AUTO_SAVE_MAX_SECONDS, Math.max(MEMO_AUTO_SAVE_MIN_SECONDS, Math.round(seconds)))
    : MEMO_AUTO_SAVE_DEFAULT_SECONDS;
}

export function isMemoAutoSaveEnabled(value) {
  return ![false, 'false', 0, '0'].includes(value);
}
