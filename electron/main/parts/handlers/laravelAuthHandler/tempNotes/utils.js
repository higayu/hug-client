// main/parts/handlers/laravelAuthHandler/tempNotes/utils.js

const TEMP_NOTE_PK = ["children_id", "staff_id", "day_of_week_id"];

/**
 * 通常のオブジェクトか確認する。
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * temp_notesのIDを整数へ変換する。
 */
function normalizeTempNoteId(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`一時メモの${fieldName}が指定されていません。`);
  }

  const normalized = Number(value);

  if (!Number.isInteger(normalized)) {
    throw new Error(`一時メモの${fieldName}は整数で指定してください。`);
  }

  return normalized;
}

/**
 * temp_notesの複合主キーを正規化する。
 */
function normalizeTempNoteKey(payload = {}) {
  if (!isPlainObject(payload)) {
    throw new TypeError("一時メモのリクエストデータがオブジェクトではありません。");
  }

  return {
    children_id: normalizeTempNoteId(payload.children_id, "children_id"),
    staff_id: normalizeTempNoteId(payload.staff_id, "staff_id"),
    day_of_week_id: normalizeTempNoteId(payload.day_of_week_id, "day_of_week_id"),
  };
}

/**
 * メモ本文を文字列へ変換する。
 */
function normalizeTempNoteText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

/**
 * temp_notesの保存データを正規化する。
 */
function normalizeTempNotePayload(payload = {}, mode = "all") {
  const key = normalizeTempNoteKey(payload);

  if (mode === "memo1") {
    return { ...key, memo1: normalizeTempNoteText(payload.memo1) };
  }

  if (mode === "memo2") {
    return { ...key, memo2: normalizeTempNoteText(payload.memo2) };
  }

  return {
    ...key,
    memo1: normalizeTempNoteText(payload.memo1),
    memo2: normalizeTempNoteText(payload.memo2),
  };
}

/**
 * temp_notes検索用の複合主キーを作成する。
 */
function buildTempNoteSearch(payload = {}) {
  const key = normalizeTempNoteKey(payload);

  return {
    key,
    params: {
      children_id: key.children_id,
      staff_id: key.staff_id,
      day_of_week_id: key.day_of_week_id,
    },
  };
}

/**
 * temp_notesの検索結果から1件取り出す。
 */
function extractFirstTempNote(result) {
  const { unwrapData } = require("../auth/utils");
  const data = unwrapData(result);

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (!isPlainObject(data)) {
    return null;
  }

  const arrayKeys = ["rows", "items", "data"];

  for (const key of arrayKeys) {
    if (Array.isArray(data[key])) {
      return data[key][0] ?? null;
    }
  }

  const isTempNote = TEMP_NOTE_PK.every((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (isTempNote) {
    return data;
  }

  return null;
}

module.exports = {
  TEMP_NOTE_PK,
  isPlainObject,
  normalizeTempNoteId,
  normalizeTempNoteKey,
  normalizeTempNoteText,
  normalizeTempNotePayload,
  buildTempNoteSearch,
  extractFirstTempNote,
};

