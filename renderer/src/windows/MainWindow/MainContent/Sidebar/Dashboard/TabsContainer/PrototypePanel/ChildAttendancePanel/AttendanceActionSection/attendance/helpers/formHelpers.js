/**
 * 拡張 form-helpers.js / timer.js 相当
 */

const HUG_TIME_RE = /^\d{1,2}:\d{2}$/;
const HALF_TIME_STORAGE_KEY = "hugAttendanceHalfTime";
const DEFAULT_HALF_TIME = "12:00";

export { HUG_TIME_RE };

export function getHalfTime() {
  try {
    const raw = localStorage.getItem(HALF_TIME_STORAGE_KEY);
    if (raw && /^\d{1,2}:\d{2}$/.test(raw.trim())) return raw.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_HALF_TIME;
}

function parseHmToMinutes(hm) {
  const m = String(hm ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutesSinceMidnight(d) {
  return d.getHours() * 60 + d.getMinutes();
}

/** 午後フラグかつハーフタイム前は入室抑止（拡張 Form.isAfternoonEnterHeldUntilHalfTime） */
export function isAfternoonEnterHeldUntilHalfTime(
  pref,
  halfTimeHm,
  nowDate = new Date()
) {
  const afternoon = Number(pref?.amPmFlag) >= 1;
  if (!afternoon) return false;
  const boundary = parseHmToMinutes(halfTimeHm);
  if (boundary == null) return true;
  return minutesSinceMidnight(nowDate) < boundary;
}

/** 拡張 buildLeavePatchFromRow */
export function buildLeavePatchFromRow(item, { mail_flg = 0 } = {}) {
  const date = String(item?.detailPageDate || "").trim();
  const enter = String(item?.enterTime || "").trim();

  if (!date) {
    throw new Error(
      "日付(detailPageDate)がありません。出席一覧を更新してください。"
    );
  }
  if (!HUG_TIME_RE.test(enter)) {
    throw new Error("入室時刻(HH:MM)が無いため退室PATCHを組めません。");
  }

  let leave = String(item?.leaveTime || "").trim();
  if (!leave) {
    const n = new Date();
    leave = `${n.getHours()}:${String(n.getMinutes()).padStart(2, "0")}`;
  }
  if (!HUG_TIME_RE.test(leave)) {
    throw new Error("退室時刻が無効です。");
  }

  const [sh, sm] = enter.split(":").map((x) => Number(x));
  const [eh, em] = leave.split(":").map((x) => Number(x));
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;

  const ih = Math.floor(diff / 60);
  const im = diff % 60;

  return {
    date,
    enter_time_hi: enter,
    leave_time_hi: leave,
    diff_check_time: diff,
    interval_time: `${ih}時間${im}分`,
    hidden_mail_only: "",
    mail_flg: Number(mail_flg),
  };
}
