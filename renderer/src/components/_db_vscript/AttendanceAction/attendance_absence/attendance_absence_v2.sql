SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

SET @app_key =
    CONVERT('hug-banso-navi' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_key =
    CONVERT('attendance_absence' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_version = 1;

DELETE FROM web_automation_flows_v2
WHERE app_key COLLATE utf8mb4_unicode_ci = @app_key
  AND flow_key COLLATE utf8mb4_unicode_ci = @flow_key
  AND version = @flow_version;

INSERT INTO web_automation_flows_v2 (
    app_key,
    flow_key,
    name,
    description,
    entry_file,
    entry_export,
    engine_version,
    config_json,
    input_schema_json,
    output_schema_json,
    timeout_ms,
    version,
    status,
    published_at
) VALUES (
    @app_key,
    @flow_key,
    '欠席',
    'HUG出席詳細画面の欠席実DOMボタンをクリックし、欠席ダイアログが開くまで待機するV2 Flow。',
    'index.js',
    'default',
    1,
    '{"category":"attendance","action":"absence","attendanceUrl":"https://www.hug-ayumu.link/hug/wm/attendance.php","loadTimeoutMs":15000,"dialogId":"addtend_dialog","dialogWrapperSelector":".ui-dialog","dialogTimeoutMs":2000,"dialogPollIntervalMs":100}',
    '{"type":"object","required":["childId"],"properties":{"action":{"type":"string"},"recordId":{"type":["string","number","null"]},"childId":{"type":["string","number"]},"facilityId":{"type":["string","number"]},"dateStr":{"type":"string"},"mailFlg":{"type":["integer","number","null"]},"absenceId":{"type":["string","null"]}}}',
    NULL,
    25000,
    @flow_version,
    'published',
    NOW()
);

SET @flow_id = LAST_INSERT_ID();

INSERT INTO web_automation_files_v2 (
    flow_id,
    file_path,
    file_type,
    source_text,
    module_type,
    config_json,
    content_hash,
    is_active
) VALUES (
    @flow_id,
    'index.js',
    'javascript',
    'const {
  executeAbsence,
} = await require("./action");

module.exports =
  async function execute({
    input,
    helpers,
    config,
    flow,
  }) {
    const result =
      await executeAbsence({
        input,
        helpers,
        config,
      });

    return {
      ...result,
      flowKey:
        flow?.flow_key ||
        "attendance_absence",
    };
  };
',
    'commonjs',
    NULL,
    SHA2('const {
  executeAbsence,
} = await require("./action");

module.exports =
  async function execute({
    input,
    helpers,
    config,
    flow,
  }) {
    const result =
      await executeAbsence({
        input,
        helpers,
        config,
      });

    return {
      ...result,
      flowKey:
        flow?.flow_key ||
        "attendance_absence",
    };
  };
', 256),
    1
);

INSERT INTO web_automation_files_v2 (
    flow_id,
    file_path,
    file_type,
    source_text,
    module_type,
    config_json,
    content_hash,
    is_active
) VALUES (
    @flow_id,
    'action.js',
    'javascript',
    'function normalize(value) {
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
',
    'commonjs',
    NULL,
    SHA2('function normalize(value) {
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
', 256),
    1
);

INSERT INTO web_automation_flow_memos_v2 (
    flow_id,
    memo,
    sort_order,
    is_active
) VALUES (
    @flow_id,
    'V1のFlow/Step/RuleまたはRenderer直書き処理をWebAutomation V2の仮想JSへ移行。HUG本体のJavaScript処理は実DOMボタンクリックへ委譲する。',
    10,
    1
);

COMMIT;
