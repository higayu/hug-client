import { executeFlowV2 } from "../core/executeFlowV2.js";
import { createProfessionalSupportRuntime } from "./professionalSupportRuntime.js";

function commonInput({ facilityId, year, month, targetDate }) {
  const sourceDate = String(targetDate || "");
  const [dateYear, dateMonth] = sourceDate.split("-");
  return {
    facilityId: String(facilityId ?? ""),
    year: Number(year || dateYear),
    month: Number(month || dateMonth),
  };
}

async function execute(flowKey, outputKey, args, options = {}) {
  const runtime = options.runtime || createProfessionalSupportRuntime({ webviewRef: options.webviewRef });
  const result = await executeFlowV2(flowKey, commonInput(args), { ...options, runtime });
  return result?.context?.[outputKey] ?? null;
}

export const fetchProfessionalSupportMonthAttendanceV2 = (args, options = {}) =>
  execute("professional_support_month_attendance_fetch", "attendanceData", args, options);

export const fetchProfessionalSupportMonthAdditionCountV2 = (args, options = {}) =>
  execute("professional_support_month_addition_count_fetch", "additionCountData", args, options);

export const fetchProfessionalSupportMonthAdditionListV2 = (args, options = {}) =>
  execute("professional_support_month_addition_list_fetch", "additionListData", args, options);
