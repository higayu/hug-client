const {
  fetchStaffPageHtml,
  initializeStaffSearchSession,
} = await require("./fetch");

const {
  parseStaffPage,
  uniqueById,
} = await require("./parse");

module.exports = async function executeStaffFetch({
  input,
  helpers,
  config,
}) {
  const facilityId = input?.facilityId;

  if (
    facilityId === undefined ||
    facilityId === null ||
    String(facilityId).trim() === ""
  ) {
    throw new Error("施設IDが指定されていません");
  }

  const requestUrl = config?.request?.url;

  if (!requestUrl) {
    throw new Error(
      "staff_fetch の request.url が設定されていません"
    );
  }

  const searchSession =
    await initializeStaffSearchSession({
      facilityId,
      helpers,
      config,
    });

  const firstPageRaw =
    await fetchStaffPageHtml({
      page: 1,
      helpers,
      config,
    });

  const firstPage =
    parseStaffPage(
      firstPageRaw.html,
      {
        page: 1,
        url:
          firstPageRaw.responseUrl ||
          requestUrl,
        config,
      }
    );

  const totalCount = firstPage.totalCount;
  const firstPageSize = firstPage.rows.length;
  const visibleMaxPage = firstPage.visibleMaxPage;

  const calculatedPageCount =
    Number.isFinite(totalCount) &&
    totalCount > 0 &&
    firstPageSize > 0
      ? Math.ceil(
          totalCount /
            firstPageSize
        )
      : 1;

  const pageCount =
    Math.max(
      1,
      visibleMaxPage,
      calculatedPageCount
    );

  let staff = [
    ...firstPage.rows,
  ];

  const pageDebug = [
    {
      page: 1,
      rowCount:
        firstPage.rows.length,
      url:
        firstPage.url,
    },
  ];

  for (
    let page = 2;
    page <= pageCount;
    page += 1
  ) {
    const raw =
      await fetchStaffPageHtml({
        page,
        helpers,
        config,
      });

    const parsed =
      parseStaffPage(
        raw.html,
        {
          page,
          url:
            raw.responseUrl ||
            requestUrl,
          config,
        }
      );

    staff = staff.concat(
      parsed.rows
    );

    pageDebug.push({
      page,
      rowCount:
        parsed.rows.length,
      url:
        parsed.url,
    });
  }

  const rawFetchedCount =
    staff.length;

  staff =
    uniqueById(staff);

  if (staff.length === 0) {
    throw new Error(
      "同期対象の職員データがありません。"
    );
  }

  if (
    Number.isFinite(totalCount) &&
    totalCount >= 0 &&
    staff.length !== totalCount
  ) {
    throw new Error(
      [
        "職員一覧の取得件数が一致しません。",
        `HUG側=${totalCount}件`,
        `実取得=${staff.length}件`,
        `生データ=${rawFetchedCount}件`,
        `ページ数=${pageCount}`,
      ].join(" / ")
    );
  }

  return {
    total_count:
      totalCount,

    raw_fetched_count:
      rawFetchedCount,

    fetched_count:
      staff.length,

    page_count:
      pageCount,

    page_debug:
      pageDebug,

    staff,

    debug: {
      searchSession,
    },
  };
};
