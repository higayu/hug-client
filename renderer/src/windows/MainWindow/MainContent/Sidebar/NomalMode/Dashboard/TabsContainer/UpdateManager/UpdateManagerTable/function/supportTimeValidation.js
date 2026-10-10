// renderer/src/components/Sidebar/Tools/UpdateManager/function/supportTimeValidation.js

/**
 * 2桁の文字列へ変換する。
 */
function pad2(value) {
  return String(value).padStart(2, "0");
}

/**
 * DB保存用に時刻をHH:mm:ss形式へ統一する。
 */
export function normalizeTimeForDb(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized = String(value).trim();

  if (normalized === "") {
    return null;
  }

  if (/^\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }

  return normalized;
}

/**
 * DB値を画面入力用のHH:mm形式へ変換する。
 */
export function formatTimeForInput(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const normalized = String(value).trim();

  const match = normalized.match(
    /^(\d{2}):(\d{2})(?::\d{2})?$/
  );

  if (!match) {
    return "";
  }

  return `${match[1]}:${match[2]}`;
}

/**
 * HH:mmまたはHH:mm:ssを秒数へ変換する。
 */
export function timeToSeconds(value) {
  const normalized =
    normalizeTimeForDb(value);

  if (!normalized) {
    return null;
  }

  if (
    !/^\d{2}:\d{2}:\d{2}$/.test(
      normalized
    )
  ) {
    return null;
  }

  const [
    hour,
    minute,
    second,
  ] = normalized
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    !Number.isInteger(second)
  ) {
    return null;
  }

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  return (
    hour * 60 * 60 +
    minute * 60 +
    second
  );
}

/**
 * 00分または30分になっているか判定する。
 */
export function isHalfHourTime(value) {
  const normalized =
    normalizeTimeForDb(value);

  if (!normalized) {
    return true;
  }

  if (
    !/^\d{2}:\d{2}:\d{2}$/.test(
      normalized
    )
  ) {
    return false;
  }

  const [
    hour,
    minute,
    second,
  ] = normalized
    .split(":")
    .map(Number);

  return (
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    (
      minute === 0 ||
      minute === 30
    ) &&
    second === 0
  );
}

/**
 * 支援開始時間と終了時間を検証する。
 *
 * 仕様:
 * - 両方未入力は許可
 * - 片方だけの入力は禁止
 * - 分は00分または30分のみ
 * - 終了時刻は開始時刻より後
 */
export function validateSupportTimeRange({
  support_start_time,
  support_end_time,
}) {
  const startTime =
    normalizeTimeForDb(
      support_start_time
    );

  const endTime =
    normalizeTimeForDb(
      support_end_time
    );

  if (
    startTime === null &&
    endTime === null
  ) {
    return {
      support_start_time: null,
      support_end_time: null,
    };
  }

  if (
    startTime !== null &&
    endTime === null
  ) {
    throw new Error(
      "支援終了時間を選択してください。"
    );
  }

  if (
    startTime === null &&
    endTime !== null
  ) {
    throw new Error(
      "支援開始時間を選択してください。"
    );
  }

  const startSeconds =
    timeToSeconds(startTime);

  const endSeconds =
    timeToSeconds(endTime);

  if (startSeconds === null) {
    throw new Error(
      "支援開始時間の形式が不正です。"
    );
  }

  if (endSeconds === null) {
    throw new Error(
      "支援終了時間の形式が不正です。"
    );
  }

  if (!isHalfHourTime(startTime)) {
    throw new Error(
      "支援開始時間の分は00分または30分を選択してください。"
    );
  }

  if (!isHalfHourTime(endTime)) {
    throw new Error(
      "支援終了時間の分は00分または30分を選択してください。"
    );
  }

  if (endSeconds <= startSeconds) {
    throw new Error(
      "支援終了時間は支援開始時間より後に設定してください。"
    );
  }

  return {
    support_start_time: startTime,
    support_end_time: endTime,
  };
}

/**
 * 00:00～23:30までの30分刻みの選択肢を作成する。
 */
export function createHalfHourTimeOptions() {
  const options = [];

  for (
    let hour = 0;
    hour <= 23;
    hour += 1
  ) {
    for (
      const minute of [0, 30]
    ) {
      const value =
        `${pad2(hour)}:${pad2(minute)}`;

      options.push({
        value,
        label: value,
      });
    }
  }

  return options;
}

export const HALF_HOUR_TIME_OPTIONS =
  createHalfHourTimeOptions();