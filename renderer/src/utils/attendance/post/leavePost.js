/**
 * 拡張 leave-post.js 相当（renderer 側パース）
 */

const RE_SEND_LEAVE =
  /sendLeaveMail\s*\(\s*['"]?([^'",)]+)['"]?\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/;

/**
 * @param {string} onclickAttr
 */
export function argsFromLeaveButton(onclickAttr) {
  const m = String(onclickAttr || "").match(RE_SEND_LEAVE);
  if (!m) {
    throw new Error("sendLeaveMail の onclick を解析できません");
  }

  const [, r_id, is_mail, c_id, f_id, attend_flg, linkage] = m;

  return {
    r_id: String(r_id).trim(),
    is_mail: Number(String(is_mail).trim()),
    c_id: Number(String(c_id).trim()),
    f_id: Number(String(f_id).trim()),
    attend_flg: Number(String(attend_flg).trim()),
    linkage: Number(String(linkage).trim()),
  };
}

export function isMailFromLeaveOnclick(onclickAttr) {
  try {
    return argsFromLeaveButton(onclickAttr).is_mail === 1;
  } catch {
    return false;
  }
}

/**
 * @param {string} onclickAttr
 * @param {object} patch
 */
export function leaveDataListFromOnclick(onclickAttr, patch = {}) {
  const args = argsFromLeaveButton(onclickAttr);
  const { mail_flg = 0, hidden_mail_only = "", ...rest } = patch;

  return {
    ...rest,
    attendance_type: 2,
    r_id: args.r_id,
    c_id: args.c_id,
    f_id: args.f_id,
    attend_flg: args.attend_flg,
    linkage: args.linkage,
    mail_flg: Number(mail_flg),
    hidden_mail_only: hidden_mail_only ?? "",
  };
}
