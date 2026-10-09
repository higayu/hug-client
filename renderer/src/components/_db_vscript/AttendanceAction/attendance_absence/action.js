function normalize(value) {
  return String(
    value ?? ""
  ).trim();
}

function parseAbsenceId(
  absenceId
) {
  const parts =
    normalize(
      absenceId
    ).split("_");

  if (
    parts.length < 5 ||
    ![
      "absence",
      "absense",
    ].includes(
      parts[0]
    )
  ) {
    return null;
  }

  return {
    raw:
      absenceId,
    recordId:
      parts[1],
    childId:
      parts[2],
    facilityId:
      parts[3],
    dateStr:
      parts[4],
    strengthAction:
      parts[5] ??
      null,
    specialSupport:
      parts[6] ??
      null,
  };
}

async function waitForLoad(
  webview,
  timeoutMs
) {
  return new Promise(
    (resolve, reject) => {
      let timer = null;

      const cleanup =
        () => {
          if (timer) {
            clearTimeout(
              timer
            );
          }

          webview.removeEventListener?.(
            "did-finish-load",
            onFinish
          );
        };

      const onFinish =
        () => {
          cleanup();
          resolve();
        };

      webview.addEventListener?.(
        "did-finish-load",
        onFinish
      );

      timer =
        setTimeout(
          () => {
            cleanup();

            reject(
              new Error(
                "HUG出席詳細画面の読込がタイムアウトしました"
              )
            );
          },
          timeoutMs
        );
    }
  );
}

exports.executeAbsence =
  async function executeAbsence({
    input,
    helpers,
    config,
  }) {
    const absenceId =
      normalize(
        input?.absenceId
      );

    const expectedChildId =
      normalize(
        input?.childId
      );

    if (!absenceId) {
      throw new Error(
        "欠席ボタンIDがありません"
      );
    }

    const parsed =
      parseAbsenceId(
        absenceId
      );

    if (!parsed) {
      throw new Error(
        `absenceId の形式が不正です: ${absenceId}`
      );
    }

    if (
      expectedChildId &&
      parsed.childId !==
        expectedChildId
    ) {
      throw new Error(
        `児童ID不一致: expected=${expectedChildId}, actual=${parsed.childId}`
      );
    }

    const webview =
      await helpers.getHugWebview();

    const baseUrl =
      config?.attendanceUrl ||
      "https://www.hug-ayumu.link/hug/wm/attendance.php";

    const url =
      new URL(
        baseUrl
      );

    url.searchParams.set(
      "mode",
      "detail"
    );

    url.searchParams.set(
      "f_id",
      parsed.facilityId
    );

    url.searchParams.set(
      "date",
      parsed.dateStr
    );

    const targetUrl =
      url.toString();

    const loadTimeoutMs =
      Number(
        config?.loadTimeoutMs
      ) > 0
        ? Number(
            config.loadTimeoutMs
          )
        : 15000;

    const finishPromise =
      waitForLoad(
        webview,
        loadTimeoutMs
      );

    const currentUrl =
      webview.getURL?.() ||
      "";

    if (
      currentUrl ===
      targetUrl
    ) {
      webview.reload();
    } else {
      webview.src =
        targetUrl;
    }

    await finishPromise;

    const result =
      await helpers.executeFunctionInWebview({
        webview,
        timeoutMs:
          Number(
            config?.dialogTimeoutMs
          ) +
            5000 ||
          10000,
        functionText: `
          async function ({
            absenceId,
            dialogId,
            wrapperSelector,
            timeoutMs,
            pollIntervalMs,
          }) {
            const button =
              document.getElementById(
                absenceId
              );

            if (!button) {
              return {
                success: false,
                error:
                  "欠席ボタンが見つかりません: " +
                  absenceId,
                absenceId,
                pageUrl:
                  location.href,
              };
            }

            button.click();

            const startedAt =
              Date.now();

            while (
              Date.now() -
                startedAt <
              timeoutMs
            ) {
              const dialog =
                document.getElementById(
                  dialogId
                );

              const wrapper =
                dialog
                  ? dialog.closest(
                      wrapperSelector
                    )
                  : null;

              if (
                dialog &&
                wrapper
              ) {
                const style =
                  window.getComputedStyle(
                    wrapper
                  );

                const isOpen =
                  style.display !==
                    "none" &&
                  style.visibility !==
                    "hidden";

                if (
                  isOpen
                ) {
                  return {
                    success: true,
                    absenceId,
                    dialogId,
                    waitedMs:
                      Date.now() -
                      startedAt,
                    pageUrl:
                      location.href,
                  };
                }
              }

              await new Promise(
                (resolve) =>
                  setTimeout(
                    resolve,
                    pollIntervalMs
                  )
              );
            }

            return {
              success: false,
              error:
                dialogId +
                " が開きませんでした",
              absenceId,
              waitedMs:
                Date.now() -
                startedAt,
              pageUrl:
                location.href,
            };
          }
        `,
        args: [
          {
            absenceId,
            dialogId:
              config?.dialogId ||
              "addtend_dialog",
            wrapperSelector:
              config?.dialogWrapperSelector ||
              ".ui-dialog",
            timeoutMs:
              Number(
                config?.dialogTimeoutMs
              ) > 0
                ? Number(
                    config.dialogTimeoutMs
                  )
                : 2000,
            pollIntervalMs:
              Number(
                config?.dialogPollIntervalMs
              ) > 0
                ? Number(
                    config.dialogPollIntervalMs
                  )
                : 100,
          },
        ],
      });

    if (
      !result?.success
    ) {
      throw new Error(
        result?.error ||
        "欠席モーダル表示に失敗しました"
      );
    }

    return {
      ...result,
      success: true,
      childId:
        parsed.childId,
      facilityId:
        parsed.facilityId,
      dateStr:
        parsed.dateStr,
      recordId:
        parsed.recordId,
    };
  };
