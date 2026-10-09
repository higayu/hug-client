const {
  fetchChildrenResponse,
} = await require("./fetch");

const {
  parseChildrenResponse,
  addPronunciationId,
} = await require("./parse");

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

module.exports = async function executeChildrenFetch({
  input,
  helpers,
  config,
}) {
  const facilityId =
    input?.facilityId;

  if (
    facilityId === undefined ||
    facilityId === null ||
    String(facilityId).trim() === ""
  ) {
    throw new Error(
      "施設IDが指定されていません"
    );
  }

  // V1と同じく児童同期は実行時点の本日を対象にする。
  // targetDateが明示された場合も、通常呼び出しでは本日を渡す。
  const targetDate =
    input?.targetDate ||
    formatLocalDate(new Date());

  const raw =
    await fetchChildrenResponse({
      facilityId,
      targetDate,
      helpers,
      config,
    });

  let children =
    parseChildrenResponse(
      raw.text,
      config
    );

  children =
    addPronunciationId(
      children
    );

  const facilityIds = [
    String(facilityId),
  ];

  children = children.map(
    (child) => ({
      ...child,
      facility_id:
        facilityIds[0],
      facility_ids:
        facilityIds,
    })
  );

  if (children.length === 0) {
    throw new Error(
      "同期対象の児童データがありません。HUGのログイン状態と施設選択を確認してください。"
    );
  }

  return {
    total_count:
      children.length,

    fetched_count:
      children.length,

    facility_ids:
      facilityIds,

    target_date:
      targetDate,

    children,

    debug: {
      responseUrl:
        raw.responseUrl,
      status:
        raw.status,
      responseLength:
        raw.text?.length ?? 0,
    },
  };
};
