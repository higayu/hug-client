function buildSearchBody({
  facilityId,
  config,
}) {
  const postFields =
    config?.postFields || {};

  const jobFields =
    config?.jobFields || {};

  const facilityMap =
    config?.facilityMap || {};

  const params =
    new URLSearchParams();

  Object.entries(postFields).forEach(
    ([key, value]) => {
      params.append(
        key,
        value ?? ""
      );
    }
  );

  Object.entries(jobFields).forEach(
    ([key, value]) => {
      params.append(
        key,
        value ?? ""
      );
    }
  );

  const facilityName =
    facilityMap[String(facilityId)] ??
    facilityMap[Number(facilityId)];

  if (
    facilityId &&
    facilityName
  ) {
    const fieldPattern =
      config?.facilityFieldPattern ||
      "f_ary[{{facilityId}}]";

    const fieldName =
      fieldPattern.replace(
        "{{facilityId}}",
        String(facilityId)
      );

    params.append(
      fieldName,
      facilityName
    );
  }

  return params.toString();
}

async function fetchInHugWebview({
  helpers,
  url,
  method = "GET",
  body = null,
  config,
}) {
  const functionText = `
    async function ({
      url,
      method,
      body,
      contentType,
    }) {
      const options = {
        method,
        credentials: "include",
        cache: "no-store",
      };

      if (method === "POST") {
        options.headers = {
          "Content-Type":
            contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        };

        options.body =
          body ?? "";
      }

      const response =
        await fetch(
          url,
          options
        );

      return {
        ok:
          response.ok,
        status:
          response.status,
        url:
          response.url,
        text:
          await response.text(),
      };
    }
  `;

  const response =
    await helpers.executeFunctionInWebview({
      functionText,
      args: [
        {
          url,
          method,
          body,
          contentType:
            config
              ?.request
              ?.contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        },
      ],
    });

  if (!response?.ok) {
    throw new Error(
      `HUG職員一覧の取得に失敗しました (HTTP ${response?.status ?? "unknown"})`
    );
  }

  return {
    html:
      response.text ?? "",

    responseUrl:
      response.url ?? url,
  };
}

exports.initializeStaffSearchSession =
  async function initializeStaffSearchSession({
    facilityId,
    helpers,
    config,
  }) {
    const requestUrl =
      config?.request?.url;

    if (!requestUrl) {
      throw new Error(
        "staff_fetch の request.url が設定されていません"
      );
    }

    const initial =
      await fetchInHugWebview({
        helpers,
        url: requestUrl,
        method: "GET",
        config,
      });

    const body =
      buildSearchBody({
        facilityId,
        config,
      });

    const search =
      await fetchInHugWebview({
        helpers,
        url: requestUrl,
        method:
          config?.request?.method ||
          "POST",
        body,
        config,
      });

    return {
      initialUrl:
        initial.responseUrl,
      searchUrl:
        search.responseUrl,
      requestUrl,
    };
  };

exports.fetchStaffPageHtml =
  async function fetchStaffPageHtml({
    page,
    helpers,
    config,
  }) {
    const requestUrl =
      config?.request?.url;

    if (!requestUrl) {
      throw new Error(
        "staff_fetch の request.url が設定されていません"
      );
    }

    const parameter =
      config?.pagination?.parameter ||
      "page";

    const url =
      new URL(requestUrl);

    url.searchParams.set(
      parameter,
      String(page)
    );

    return fetchInHugWebview({
      helpers,
      url:
        url.toString(),
      method: "GET",
      config,
    });
  };
