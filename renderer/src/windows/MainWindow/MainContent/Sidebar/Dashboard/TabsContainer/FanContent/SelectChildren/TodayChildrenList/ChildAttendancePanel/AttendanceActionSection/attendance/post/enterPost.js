/**
 * 拡張 enter-post.js 相当（renderer 側パース）
 */

const RE_SEND_ENTER_10 =
  /sendEnterMail\s*\(\s*['"]?([^'",)]+)['"]?\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*['"]?([^'",)]+)['"]?\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/;

const RE_SEND_ENTER_8 =
  /sendEnterMail\s*\(\s*['"]?([^'",)]+)['"]?\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*['"]?([^'",)]+)['"]?\s*,\s*([^)]+)\s*\)/;

/**
 * @param {string} onclickAttr
 */
export function parseEnterOnclick(onclickAttr) {
  let is_mail;
  let r_id;
  let c_id;
  let f_id;
  let attend_flg;
  let linkage;
  let date;
  let strength_action;
  let special_support;
  let meal_add;

  const m10 = String(onclickAttr || "").match(RE_SEND_ENTER_10);
  if (m10) {
    [, r_id, is_mail, c_id, f_id, attend_flg, linkage, date, strength_action, special_support, meal_add] =
      m10;
  } else {
    const m8 = String(onclickAttr || "").match(RE_SEND_ENTER_8);
    if (!m8) {
      throw new Error("sendEnterMail の onclick を解析できません");
    }
    [, r_id, is_mail, c_id, f_id, attend_flg, linkage, date, strength_action] = m8;
    special_support = "0";
    meal_add = "0";
  }

  return {
    is_mail: Number(String(is_mail).trim()),
    r_id: String(r_id).trim(),
    c_id: String(c_id).trim(),
    f_id: String(f_id).trim(),
    attend_flg: String(attend_flg).trim(),
    linkage: String(linkage).trim(),
    date: String(date).trim(),
    strength_action: String(strength_action).trim(),
    special_support: String(special_support).trim(),
    meal_add: String(meal_add).trim(),
  };
}

export function isMailFromEnterOnclick(onclickAttr) {
  try {
    return parseEnterOnclick(onclickAttr).is_mail === 1;
  } catch {
    return false;
  }
}

/**
 * @param {string} onclickAttr
 * @param {{ mail_flg?: number }} [opts]
 */
export function dataListFromEnterButton(onclickAttr, { mail_flg = 0 } = {}) {
  const parsed = parseEnterOnclick(onclickAttr);
  return {
    attendance_type: 1,
    r_id: parsed.r_id,
    mail_flg: Number(mail_flg),
    c_id: Number(parsed.c_id),
    f_id: Number(parsed.f_id),
    attend_flg: Number(parsed.attend_flg),
    linkage: Number(parsed.linkage),
    date: parsed.date,
    strength_action: Number(parsed.strength_action),
    special_support: Number(parsed.special_support),
    meal_add: Number(parsed.meal_add),
  };
}
