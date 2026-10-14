const apiClient = require("../../../../../../src/apiClient");

const PROCEDURE_NAME = "get_service_record_monthly";

function buildParams(data = {}) {
  const targetMonth = String(data.target_month ?? "").trim();
  const dayOfWeekId = Number(data.day_of_week_id);
  const facilityId = Number(data.facility_id);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    throw new Error("target_monthはYYYY-MM形式で指定してください。");
  }

  if (!Number.isInteger(dayOfWeekId) || dayOfWeekId <= 0) {
    throw new Error("day_of_week_idが不正です。");
  }

  if (!Number.isInteger(facilityId) || facilityId <= 0) {
    throw new Error("facility_idが不正です。");
  }

  return [targetMonth, dayOfWeekId, facilityId];
}

async function getServiceRecordMonthly(data = {}) {
  const params = buildParams(data);

  console.log("📨 main: getServiceRecordMonthly SEND:", {
    procedure: PROCEDURE_NAME,
    params,
  });

  return apiClient.callProcedure(PROCEDURE_NAME, params);
}

module.exports = {
  PROCEDURE_NAME,
  buildParams,
  getServiceRecordMonthly,
};
