import { executeFlowV2 } from "../core/executeFlowV2.js";
import { createAttendanceRuntime } from "./attendanceRuntime.js";

function normalizeBaseInput(input = {}) {
  return {
    ...input,
    facilityId: String(input.facilityId || "1"),
    dateStr: String(input.dateStr || new Date().toISOString().slice(0, 10)),
    childId:
      input.childId === undefined || input.childId === null
        ? undefined
        : String(input.childId),
    sendMail: Number(input.sendMail ?? input.mailFlg ?? input.mail_flg ?? 0) === 1 ? 1 : 0,
  };
}

export async function fetchTodayAttendanceV2(input = {}, runtimeOptions = {}) {
  const runtime = createAttendanceRuntime(runtimeOptions);
  return executeFlowV2(
    "attendance_fetch_today_users",
    normalizeBaseInput(input),
    { runtime }
  );
}

export async function executeAttendanceEnterV2(input = {}, runtimeOptions = {}) {
  const normalized = normalizeBaseInput(input);
  const flowKey = normalized.sendMail === 1
    ? "attendance_enter_with_mail"
    : "attendance_enter_no_mail";
  const runtime = createAttendanceRuntime(runtimeOptions);
  return executeFlowV2(flowKey, normalized, { runtime });
}

export async function executeAttendanceLeaveV2(input = {}, runtimeOptions = {}) {
  const normalized = normalizeBaseInput(input);
  const flowKey = normalized.sendMail === 1
    ? "attendance_leave_with_mail"
    : "attendance_leave_no_mail";
  const runtime = createAttendanceRuntime(runtimeOptions);
  return executeFlowV2(flowKey, normalized, { runtime });
}
