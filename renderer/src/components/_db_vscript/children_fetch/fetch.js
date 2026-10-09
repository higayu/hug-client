function buildChildPostBody({
  facilityId,
  targetDate,
  config,
}) {
  const params =
    new URLSearchParams();

  const facilityFieldPattern =
    config?.facilityFieldPattern ||
    "f_ary[{{facilityId}}]";

  const facilityField =
    facilityFieldPattern.replace(
      "{{facilityId}}",
      String(facilityId)
    );

  params.set(
    facilityField,
    String(facilityId)
  );

  const postFields =
    config?.postFields || {};

  Object.entries(
    postFields
  ).forEach(
    ([key, value]) => {
      const replaced =
        String(value ?? "")
          .replace(
            /\{\{targetDate\}\}/g,
            targetDate
          );

      params.set(
        key,
        replaced
      );
    }
  );

  if (
    !params.has("target_date")
  ) {
    params.set(
      "target_date",
      targetDate
    );
  }

  return params.toString();
}

exports.fetchChildrenResponse =
  async function fetchChildrenResponse({
    facilityId,
    targetDate,
    helpers,
    config,
  }) {
    const request =
      config?.request || {};

    const url =
      request.url ||
      "https://www.hug-ayumu.link/hug/wm/ajax/ajax_child_agreement_filter.php";

    const body =
      buildChildPostBody({
        facilityId,
        targetDate,
        config,
      });

    const functionText = `
      async function ({
        url,
        method,
        body,
        contentType,
        xRequestedWith,
      }) {
        const headers = {
          "Content-Type":
            contentType ||
            "application/x-www-form-urlencoded; charset=UTF-8",
        };

        if (xRequestedWith) {
          headers["X-Requested-With"] =
            xRequestedWith;
        }

        const response =
          await fetch(
            url,
            {
              method:
                method || "POST",
              credentials:
                "include",
              cache:
                "no-store",
              headers,
              body,
            }
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
            method:
              request.method ||
              "POST",
            body,
            contentType:
              request.contentType ||
              "application/x-www-form-urlencoded; charset=UTF-8",
            xRequestedWith:
              request.xRequestedWith ||
              "XMLHttpRequest",
          },
        ],
      });

    if (!response?.ok) {
      throw new Error(
        `HUG児童一覧の取得に失敗しました (HTTP ${response?.status ?? "unknown"})`
      );
    }

    return {
      text:
        response.text ?? "",
      responseUrl:
        response.url ?? url,
      status:
        response.status,
    };
  };
