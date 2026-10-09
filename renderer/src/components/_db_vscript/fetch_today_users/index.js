const { fetchAttendanceHtml } = await require("./fetch");
const { extractColumnData } = await require("./parse");

module.exports = async function executeAttendanceFetchTodayUsers({
  input,
  helpers,
  config,
  flow,
}) {
  const raw = await fetchAttendanceHtml({
    input,
    helpers,
    config,
  });

  if (!raw?.ok) {
    throw new Error(
      raw?.error || "利用者データ取得に失敗しました"
    );
  }

  const extracted = await extractColumnData(
    raw.html,
    config
  );

  if (!extracted?.success) {
    throw new Error(
      extracted?.error || "利用者データ抽出に失敗しました"
    );
  }

  return {
    ...raw,

    flowKey:
      flow?.flow_key ||
      "attendance_fetch_today_users",

    automationConfig: config,

    extracted,
  };
};
