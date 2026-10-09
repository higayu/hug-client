exports.fetchAttendanceHtml = async function fetchAttendanceHtml({
  input,
  helpers,
  config,
}) {
  const facilityId = String(input?.facilityId || "");
  const dateStr = String(input?.dateStr || "");

  if (!facilityId || !dateStr) {
    throw new Error(
      "施設IDまたは日付が設定されていません"
    );
  }

  const runtimeConfig = {
    ...config,

    request: {
      ...(config?.request || {}),

      query: {
        ...(config?.request?.query || {}),
        f_id: facilityId,
        date: dateStr,
      },
    },
  };

  const webviewFunction = async (CONFIG) => {
    const request = CONFIG.request || {};
    const tableConfig = CONFIG.table || {};
    const loginCheck = CONFIG.loginCheck || {};

    const params = new URLSearchParams();

    Object.entries(request.query || {}).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          params.set(key, String(value));
        }
      }
    );

    const queryString = params.toString();

    const targetUrl =
      request.url +
      (queryString
        ? (
            request.url.includes("?")
              ? "&"
              : "?"
          ) + queryString
        : "");

    const extractTableFromDocument = (doc) => {
      let table = null;

      if (tableConfig.primarySelector) {
        table = doc.querySelector(
          tableConfig.primarySelector
        );
      }

      if (
        !table &&
        tableConfig.fallbackSelector
      ) {
        table = doc.querySelector(
          tableConfig.fallbackSelector
        );
      }

      if (!table) {
        const tables =
          doc.querySelectorAll("table");

        if (tables.length > 0) {
          table = tables[0];
        }
      }

      if (!table) {
        return null;
      }

      const rows =
        table.querySelectorAll("tr");

      return {
        html: table.outerHTML,
        rowCount: rows.length,
        className:
          table.className || "",
      };
    };

    try {
      const response = await fetch(
        targetUrl,
        {
          method:
            request.method || "GET",

          credentials:
            request.credentials ||
            "include",

          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "HTTP error: " +
            response.status
        );
      }

      const pageHtml =
        await response.text();

      const doc =
        new DOMParser().parseFromString(
          pageHtml,
          "text/html"
        );

      if (loginCheck.enabled !== false) {
        const selectorMatched =
          loginCheck.loginInputSelector
            ? doc.querySelector(
                loginCheck.loginInputSelector
              ) !== null
            : false;

        const titleMatched =
          loginCheck.titleContains
            ? (doc.title || "").includes(
                loginCheck.titleContains
              )
            : false;

        const htmlMatched =
          loginCheck.htmlContains
            ? pageHtml.includes(
                loginCheck.htmlContains
              )
            : false;

        if (
          selectorMatched ||
          titleMatched ||
          htmlMatched
        ) {
          throw new Error(
            "ログインページが返されました。HUGへのログイン状態を確認してください"
          );
        }
      }

      const tableResult =
        extractTableFromDocument(doc);

      if (!tableResult) {
        throw new Error(
          "利用者テーブルが見つかりません"
        );
      }

      return {
        ok: true,
        html: tableResult.html,
        rowCount:
          tableResult.rowCount,
        className:
          tableResult.className,
        pageTitle: doc.title || "",
        pageUrl:
          response.url ||
          targetUrl,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.message ||
          String(error),
      };
    }
  };

  return helpers.executeFunctionInWebview({
    functionText:
      webviewFunction.toString(),

    args: [
      runtimeConfig,
    ],
  });
};
