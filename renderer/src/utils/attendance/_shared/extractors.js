// src/utils/attendance/_shared/extractors.js

/**
 * column5Html から入室ボタンの onclick を抽出
 */
export function extractEnterButtonOnclick(column5Html) {
    if (!column5Html) return null;
    const m = String(column5Html).match(/onclick\s*=\s*["']([^"']+)["']/i);
    return m?.[1] ?? null;
  }
  
  /**
   * column6Html から退室ボタンの onclick を抽出
   */
  export function extractExitButtonOnclick(column6Html) {
    if (!column6Html) return null;
    const m = String(column6Html).match(/onclick\s*=\s*["']([^"']+)["']/i);
    return m?.[1] ?? null;
  }
  
  /**
   * column5Html から欠席ボタンID（absence_...）を抽出
   */
  export function extractAbsenceButtonId(column5Html) {
    const m = String(column5Html || "").match(/id\s*=\s*"((?:absence|absense)_[^"]+)"/i);
    return m?.[1] ?? null;
  }
  
  export function parseAbsenceId(absenceId) {
    const parts = String(absenceId || "").split("_");
    if (parts.length < 5 || parts[0] !== "absence") return null;
  
    return {
      raw: absenceId,
      r_id: parts[1],
      c_id: parts[2], // ✅ 児童ID
      f_id: parts[3],
      date: parts[4],
      strength_action: parts[5] ?? null,
      special_support: parts[6] ?? null,
    };
  }
  
  export function assertAbsenceChildId(absenceId, expectedChildId) {
    const parsed = parseAbsenceId(absenceId);
    if (!parsed) throw new Error(`absenceId の形式が不正です: ${absenceId}`);

    if (String(parsed.c_id) !== String(expectedChildId)) {
      throw new Error(
        `児童ID不一致: expected=${expectedChildId}, absenceId.c_id=${parsed.c_id}, absenceId=${absenceId}`
      );
    }
    return parsed;
  }

const RE_SEND_ENTER =
  /sendEnterMail\s*\(\s*['"]?[^'",)]+['"]?\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)/;

const RE_SEND_LEAVE =
  /sendLeaveMail\s*\(\s*['"]?[^'",)]+['"]?\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)/;

/** sendEnterMail onclick から is_mail, c_id 等を粗くパース */
export function parseEnterArgsFromOnclick(onclickAttr) {
  const m = String(onclickAttr || "").match(RE_SEND_ENTER);
  if (!m) return null;
  return {
    is_mail: Number(String(m[1]).trim()),
    c_id: String(m[3]).trim().replace(/^'|'$/g, ""),
  };
}

/** sendLeaveMail onclick から is_mail, c_id 等を粗くパース */
export function parseLeaveArgsFromOnclick(onclickAttr) {
  const m = String(onclickAttr || "").match(RE_SEND_LEAVE);
  if (!m) return null;
  return {
    is_mail: Number(String(m[1]).trim()),
    c_id: String(m[3]).trim().replace(/^'|'$/g, ""),
  };
}
