import { formatYmdToHugInterviewDate } from "@/utils/professionalSupport/formatInterviewDate.js";

const HUG_TIME_RE = /^\d{1,2}:\d{2}$/;

/**
 * 拡張 form-helpers.js buildLeavePatchFromRow 相当（renderer 側）
 * @param {{ dateStr?: string, enterTime?: string, leaveTime?: string, mail_flg?: number }} opts
 */
export function buildLeavePatchFromTimes({
  dateStr,
  enterTime,
  leaveTime,
  mail_flg = 0,
} = {}) {
  const date = formatYmdToHugInterviewDate(dateStr);
  const enter = String(enterTime || "").trim();

  if (!date) {
    throw new Error("日付が指定されていません");
  }
  if (!HUG_TIME_RE.test(enter)) {
    throw new Error("入室時刻(HH:MM)が無いため退室PATCHを組めません");
  }

  let leave = String(leaveTime || "").trim();
  if (!leave) {
    const n = new Date();
    leave = `${n.getHours()}:${String(n.getMinutes()).padStart(2, "0")}`;
  }
  if (!HUG_TIME_RE.test(leave)) {
    throw new Error("退室時刻が無効です");
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
