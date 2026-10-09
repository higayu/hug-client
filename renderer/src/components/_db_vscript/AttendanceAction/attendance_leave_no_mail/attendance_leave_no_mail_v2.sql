SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';

START TRANSACTION;

SET @app_key =
    CONVERT('hug-banso-navi' USING utf8mb4)
    COLLATE utf8mb4_unicode_ci;

SET @flow_key =
    CONVERT('attendance_leave_no_mail' USING utf8mb4)
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
    '退室（メール通知なし）',
    'HUG出席詳細画面の実DOM退室ボタンをクリックし、完了まで待機するV2 Flow。',
    'index.js',
    'default',
    1,
    '{"category":"attendance","action":"leave","mailMode":"no_mail","attendanceUrl":"https://www.hug-ayumu.link/hug/wm/attendance.php","tableSelector":"table.sortTable01:not(.sortTableAdding):not(.js_adding_table)","loadTimeoutMs":15000,"detectMailDialog":false,"functionName":"sendLeaveMail","cellIdPrefix":"leave","selectorTemplate":"#leave{{recordId}} button[onclick*=\\"sendLeaveMail\\"]","mailDialogSelector":"#addtend_dialog_mail","mailDialogButtonSelector":".send_mail_button[data-send_mail=\\"{{sendMail}}\\"]","mailDialogTimeoutMs":10000,"attendanceActionCompletionTimeoutMs":12000}',
    '{"type":"object","required":["childId"],"properties":{"action":{"type":"string"},"recordId":{"type":["string","number","null"]},"childId":{"type":["string","number"]},"facilityId":{"type":["string","number"]},"dateStr":{"type":"string"},"mailFlg":{"type":["integer","number","null"]},"absenceId":{"type":["string","null"]}}}',
    NULL,
    40000,
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
  executeAttendanceAction,
} = await require("./action");

module.exports =
  async function execute({
    input,
    helpers,
    config,
    flow,
  }) {
    const result =
      await executeAttendanceAction({
        input,
        helpers,
        config,
      });

    return {
      ...result,
      flowKey:
        flow?.flow_key ||
        null,
    };
  };
',
    'commonjs',
    NULL,
    SHA2('const {
  executeAttendanceAction,
} = await require("./action");

module.exports =
  async function execute({
    input,
    helpers,
    config,
    flow,
  }) {
    const result =
      await executeAttendanceAction({
        input,
        helpers,
        config,
      });

    return {
      ...result,
      flowKey:
        flow?.flow_key ||
        null,
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
    'function normalizeId(value) {
  return String(
    value ?? ""
  ).trim();
}

function buildAttendanceUrl(
  config,
  facilityId,
  dateStr
) {
  const baseUrl =
    config?.attendanceUrl ||
    "https://www.hug-ayumu.link/hug/wm/attendance.php";

  const url =
    new URL(baseUrl);

  url.searchParams.set(
    "mode",
    "detail"
  );

  url.searchParams.set(
    "f_id",
    normalizeId(
      facilityId
    )
  );

  url.searchParams.set(
    "date",
    normalizeId(
      dateStr
    )
  );

  return url.toString();
}

async function waitForWebviewLoad(
  webview,
  timeoutMs
) {
  return new Promise(
    (resolve, reject) => {
      let timer = null;

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
        }

        webview.removeEventListener?.(
          "did-finish-load",
          onFinish
        );

        webview.removeEventListener?.(
          "did-fail-load",
          onFail
        );
      };

      const onFinish = () => {
        cleanup();
        resolve();
      };

      const onFail = (event) => {
        if (
          Number(
            event?.errorCode
          ) === -3
        ) {
          return;
        }

        cleanup();

        reject(
          new Error(
            event?.errorDescription ||
            "HUG WebViewの読込に失敗しました"
          )
        );
      };

      webview.addEventListener?.(
        "did-finish-load",
        onFinish
      );

      webview.addEventListener?.(
        "did-fail-load",
        onFail
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

async function loadAttendanceDetail({
  helpers,
  config,
  facilityId,
  dateStr,
}) {
  const webview =
    await helpers.getHugWebview();

  const targetUrl =
    buildAttendanceUrl(
      config,
      facilityId,
      dateStr
    );

  const loadTimeoutMs =
    Number(
      config?.loadTimeoutMs
    ) > 0
      ? Number(
          config.loadTimeoutMs
        )
      : 15000;

  const currentUrl =
    webview.getURL?.() ||
    webview.getAttribute?.(
      "src"
    ) ||
    "";

  const finishPromise =
    waitForWebviewLoad(
      webview,
      loadTimeoutMs
    );

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

  const ready =
    await helpers.executeFunctionInWebview({
      webview,
      timeoutMs:
        loadTimeoutMs,
      functionText: `
        async function ({
          facilityId,
          dateStr,
          tableSelector,
          timeoutMs,
        }) {
          const startedAt =
            Date.now();

          while (
            Date.now() -
              startedAt <
            timeoutMs
          ) {
            const url =
              new URL(
                location.href
              );

            const table =
              document.querySelector(
                tableSelector
              );

            const ready =
              document.readyState ===
                "complete" &&
              url.searchParams.get(
                "f_id"
              ) ===
                String(
                  facilityId
                ) &&
              url.searchParams.get(
                "date"
              ) ===
                String(
                  dateStr
                ) &&
              Boolean(table);

            if (ready) {
              return {
                success: true,
                pageUrl:
                  location.href,
              };
            }

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  50
                )
            );
          }

          return {
            success: false,
            error:
              "HUG出席詳細DOMの準備を確認できませんでした",
            pageUrl:
              location.href,
            readyState:
              document.readyState,
          };
        }
      `,
      args: [
        {
          facilityId,
          dateStr,
          tableSelector:
            config?.tableSelector ||
            "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)",
          timeoutMs:
            loadTimeoutMs,
        },
      ],
    });

  if (!ready?.success) {
    throw new Error(
      ready?.error ||
      "HUG出席詳細DOMの準備を確認できませんでした"
    );
  }

  return webview;
}

exports.executeAttendanceAction =
  async function executeAttendanceAction({
    input,
    helpers,
    config,
  }) {
    const action =
      String(
        config?.action ||
        input?.action ||
        ""
      );

    const facilityId =
      normalizeId(
        input?.facilityId
      );

    const dateStr =
      normalizeId(
        input?.dateStr
      );

    const childId =
      normalizeId(
        input?.childId
      );

    const recordId =
      normalizeId(
        input?.recordId
      );

    if (
      action !== "enter" &&
      action !== "leave"
    ) {
      throw new Error(
        `未対応の入退室種別です: ${action}`
      );
    }

    if (!facilityId) {
      throw new Error(
        "施設IDがありません"
      );
    }

    if (!dateStr) {
      throw new Error(
        "日付がありません"
      );
    }

    if (!childId) {
      throw new Error(
        "児童IDがありません"
      );
    }

    const mailMode =
      config?.mailMode ||
      "no_mail";

    const mailFlg =
      mailMode ===
      "no_mail"
        ? 0
        : (
            Number(
              input?.mailFlg
            ) === 1
              ? 1
              : 0
          );

    const webview =
      await loadAttendanceDetail({
        helpers,
        config,
        facilityId,
        dateStr,
      });

    const result =
      await helpers.executeFunctionInWebview({
        webview,
        timeoutMs:
          Number(
            config
              ?.attendanceActionCompletionTimeoutMs
          ) +
            Number(
              config
                ?.mailDialogTimeoutMs
            ) +
            5000 ||
          30000,
        functionText: `
          async function ({
            action,
            childId,
            recordId,
            mailFlg,
            config,
          }) {
            const functionName =
              config.functionName;

            const cellIdPrefix =
              config.cellIdPrefix;

            const selectorTemplate =
              config.selectorTemplate;

            const detectMailDialog =
              Boolean(
                config.detectMailDialog
              ) &&
              Number(
                mailFlg
              ) === 1;

            const mailDialogSelector =
              config.mailDialogSelector ||
              "#addtend_dialog_mail";

            const mailDialogButtonSelector =
              config.mailDialogButtonSelector ||
              ''.send_mail_button[data-send_mail="{{sendMail}}"]'';

            const mailDialogTimeoutMs =
              Number(
                config.mailDialogTimeoutMs
              ) > 0
                ? Number(
                    config.mailDialogTimeoutMs
                  )
                : 10000;

            const completionTimeoutMs =
              Number(
                config.attendanceActionCompletionTimeoutMs
              ) > 0
                ? Number(
                    config.attendanceActionCompletionTimeoutMs
                  )
                : 12000;

            const label =
              action === "leave"
                ? "退室"
                : "入室";

            const isVisible =
              (element) => {
                if (!element) {
                  return false;
                }

                const style =
                  window.getComputedStyle(
                    element
                  );

                const rect =
                  element.getBoundingClientRect();

                return (
                  style.display !==
                    "none" &&
                  style.visibility !==
                    "hidden" &&
                  Number(
                    style.opacity ||
                    1
                  ) !== 0 &&
                  rect.width > 0 &&
                  rect.height > 0
                );
              };

            const extractIdsFromOnclick =
              (onclick) => {
                const text =
                  String(
                    onclick ||
                    ""
                  );

                const pattern =
                  action ===
                  "leave"
                    ? /sendLeaveMail\\\\s*\\\\(\\\\s*[''"]?([^''",)\\\\s]+)[''"]?\\\\s*,\\\\s*([^,]+)\\\\s*,\\\\s*([^,]+)/i
                    : /sendEnterMail\\\\s*\\\\(\\\\s*[''"]?([^''",)\\\\s]+)[''"]?\\\\s*,\\\\s*([^,]+)\\\\s*,\\\\s*([^,]+)/i;

                const match =
                  text.match(
                    pattern
                  );

                if (!match) {
                  return null;
                }

                return {
                  recordId:
                    String(
                      match[1]
                    ).trim(),
                  isMail:
                    Number(
                      String(
                        match[2]
                      ).trim()
                    ),
                  childId:
                    String(
                      match[3]
                    )
                      .trim()
                      .replace(
                        /^[''"]|[''"]$/g,
                        ""
                      ),
                };
              };

            let resolvedRecordId =
              String(
                recordId ||
                ""
              ).trim();

            let button = null;

            if (
              resolvedRecordId &&
              selectorTemplate
            ) {
              const selector =
                selectorTemplate.replace(
                  /\\\\{\\\\{\\\\s*recordId\\\\s*\\\\}\\\\}/g,
                  resolvedRecordId
                );

              button =
                document.querySelector(
                  selector
                );
            }

            if (!button) {
              const candidates =
                Array.from(
                  document.querySelectorAll(
                    "button[onclick*=''" +
                      functionName +
                      "'']"
                  )
                );

              for (
                const candidate of
                candidates
              ) {
                const parsed =
                  extractIdsFromOnclick(
                    candidate.getAttribute(
                      "onclick"
                    )
                  );

                if (
                  parsed &&
                  String(
                    parsed.childId
                  ) ===
                    String(
                      childId
                    )
                ) {
                  button =
                    candidate;

                  resolvedRecordId =
                    parsed.recordId ||
                    resolvedRecordId;

                  break;
                }
              }
            }

            if (!button) {
              return {
                success: false,
                error:
                  label +
                  "ボタンが見つかりません",
                recordId:
                  resolvedRecordId ||
                  null,
                childId,
                pageUrl:
                  location.href,
              };
            }

            const onclickCode =
              button.getAttribute(
                "onclick"
              ) ||
              "";

            const parsedButton =
              extractIdsFromOnclick(
                onclickCode
              );

            if (
              parsedButton?.childId &&
              String(
                parsedButton.childId
              ) !==
                String(
                  childId
                )
            ) {
              return {
                success: false,
                error:
                  "児童ID不一致: expected=" +
                  childId +
                  ", actual=" +
                  parsedButton.childId,
                pageUrl:
                  location.href,
              };
            }

            resolvedRecordId =
              parsedButton?.recordId ||
              resolvedRecordId;

            const cellId =
              cellIdPrefix +
              resolvedRecordId;

            const waitAndApplyMailChoice =
              () =>
                new Promise(
                  (resolve) => {
                    const startedAt =
                      Date.now();

                    let finished =
                      false;

                    let observer =
                      null;

                    let timer =
                      null;

                    const finish =
                      (value) => {
                        if (
                          finished
                        ) {
                          return;
                        }

                        finished =
                          true;

                        observer?.disconnect();

                        if (timer) {
                          clearTimeout(
                            timer
                          );
                        }

                        resolve(
                          value
                        );
                      };

                    const tryApply =
                      () => {
                        const dialog =
                          document.querySelector(
                            mailDialogSelector
                          );

                        if (
                          !dialog
                        ) {
                          return false;
                        }

                        const wrapper =
                          dialog.closest(
                            ".ui-dialog"
                          );

                        if (
                          !isVisible(
                            wrapper ||
                            dialog
                          )
                        ) {
                          return false;
                        }

                        const selector =
                          mailDialogButtonSelector.replace(
                            /\\\\{\\\\{\\\\s*sendMail\\\\s*\\\\}\\\\}/g,
                            String(
                              mailFlg
                            )
                          );

                        const target =
                          dialog.querySelector(
                            selector
                          );

                        if (
                          !target ||
                          target.disabled
                        ) {
                          return false;
                        }

                        const value = {
                          detected:
                            true,
                          autoSelected:
                            true,
                          sendMail:
                            Number(
                              mailFlg
                            ),
                          text:
                            (
                              target.textContent ||
                              ""
                            ).trim(),
                          dialogId:
                            dialog.id,
                          detectedAfterMs:
                            Date.now() -
                            startedAt,
                        };

                        target.click();

                        finish(
                          value
                        );

                        return true;
                      };

                    observer =
                      new MutationObserver(
                        tryApply
                      );

                    observer.observe(
                      document.body ||
                        document.documentElement,
                      {
                        childList:
                          true,
                        subtree:
                          true,
                        attributes:
                          true,
                        attributeFilter:
                          [
                            "style",
                            "class",
                            "aria-hidden",
                          ],
                      }
                    );

                    tryApply();

                    timer =
                      setTimeout(
                        () => {
                          const dialog =
                            document.querySelector(
                              mailDialogSelector
                            );

                          const wrapper =
                            dialog?.closest(
                              ".ui-dialog"
                            ) ||
                            null;

                          finish({
                            detected:
                              false,
                            autoSelected:
                              false,
                            reason:
                              "hug-mail-dialog-not-opened",
                            waitedMs:
                              Date.now() -
                              startedAt,
                            dialogExists:
                              Boolean(
                                dialog
                              ),
                            dialogVisible:
                              Boolean(
                                dialog &&
                                isVisible(
                                  wrapper ||
                                  dialog
                                )
                              ),
                            pageUrl:
                              location.href,
                          });
                        },
                        mailDialogTimeoutMs
                      );
                  }
                );

            const mailDialogPromise =
              detectMailDialog
                ? waitAndApplyMailChoice()
                : Promise.resolve({
                    detected:
                      false,
                    autoSelected:
                      false,
                    skipped:
                      true,
                    reason:
                      "mail-dialog-detection-disabled",
                  });

            button.click();

            const mailDialog =
              await mailDialogPromise;

            if (
              detectMailDialog &&
              !mailDialog?.detected
            ) {
              return {
                success: false,
                mode:
                  "dom-button-click-mutation-observer",
                action,
                recordId:
                  resolvedRecordId,
                childId,
                mailDialog,
                error:
                  "HUG側のメール通知モーダルを検知できませんでした。HUG本体の処理は開始されています。",
                pageUrl:
                  location.href,
              };
            }

            const completion =
              await new Promise(
                (resolve) => {
                  const startedAt =
                    Date.now();

                  let finished =
                    false;

                  let observer =
                    null;

                  let timer =
                    null;

                  const finish =
                    (value) => {
                      if (
                        finished
                      ) {
                        return;
                      }

                      finished =
                        true;

                      observer?.disconnect();

                      if (
                        timer
                      ) {
                        clearTimeout(
                          timer
                        );
                      }

                      resolve(
                        value
                      );
                    };

                  const check =
                    () => {
                      const currentCell =
                        document.getElementById(
                          cellId
                        );

                      if (
                        !currentCell
                      ) {
                        return false;
                      }

                      const remainingButton =
                        currentCell.querySelector(
                          "button[onclick*=''" +
                            functionName +
                            "'']"
                        );

                      if (
                        !remainingButton
                      ) {
                        finish({
                          completed:
                            true,
                          completedAfterMs:
                            Date.now() -
                            startedAt,
                          cellId,
                          cellText:
                            (
                              currentCell.textContent ||
                              ""
                            ).trim(),
                          pageUrl:
                            location.href,
                        });

                        return true;
                      }

                      return false;
                    };

                  observer =
                    new MutationObserver(
                      check
                    );

                  observer.observe(
                    document.body ||
                      document.documentElement,
                    {
                      childList:
                        true,
                      subtree:
                        true,
                      characterData:
                        true,
                      attributes:
                        true,
                      attributeFilter:
                        [
                          "style",
                          "class",
                          "disabled",
                        ],
                    }
                  );

                  check();

                  timer =
                    setTimeout(
                      () => {
                        const currentCell =
                          document.getElementById(
                            cellId
                          );

                        const remainingButton =
                          currentCell?.querySelector(
                            "button[onclick*=''" +
                              functionName +
                              "'']"
                          );

                        finish({
                          completed:
                            !remainingButton &&
                            Boolean(
                              currentCell
                            ),
                          reason:
                            "attendance-action-completion-timeout",
                          waitedMs:
                            Date.now() -
                            startedAt,
                          cellId,
                          cellText:
                            (
                              currentCell?.textContent ||
                              ""
                            ).trim(),
                          pageUrl:
                            location.href,
                        });
                      },
                      completionTimeoutMs
                    );
                }
              );

            if (
              !completion?.completed
            ) {
              return {
                success: false,
                action,
                recordId:
                  resolvedRecordId,
                childId,
                mailDialog,
                completion,
                error:
                  label +
                  "処理の完了を確認できませんでした",
                pageUrl:
                  location.href,
              };
            }

            return {
              success: true,
              mode:
                "dom-button-click-mutation-observer",
              action,
              kind:
                action,
              recordId:
                resolvedRecordId,
              rId:
                resolvedRecordId,
              childId,
              buttonInfo: {
                id:
                  button.id ||
                  null,
                className:
                  button.className ||
                  "",
                text:
                  (
                    button.textContent ||
                    ""
                  ).trim(),
                onclick:
                  onclickCode,
                outerHTML:
                  (
                    button.outerHTML ||
                    ""
                  ).slice(
                    0,
                    500
                  ),
              },
              mailDialog,
              completion,
              mailDialogDetected:
                Boolean(
                  mailDialog?.detected
                ),
              mailDialogAutoSelected:
                Boolean(
                  mailDialog?.autoSelected
                ),
              attendanceActionCompleted:
                true,
              selectedSendMail:
                Number(
                  mailFlg
                ),
              pageUrl:
                location.href,
              statusMessage:
                "HUG本体の" +
                label +
                "処理を開始しました。",
            };
          }
        `,
        args: [
          {
            action,
            childId,
            recordId,
            mailFlg,
            config,
          },
        ],
      });

    if (
      !result?.success
    ) {
      throw new Error(
        result?.error ||
        `${
          action === "leave"
            ? "退室"
            : "入室"
        }処理に失敗しました`
      );
    }

    return {
      ...result,
      success: true,
      mailFlg,
      mail_flg:
        mailFlg,
    };
  };
',
    'commonjs',
    NULL,
    SHA2('function normalizeId(value) {
  return String(
    value ?? ""
  ).trim();
}

function buildAttendanceUrl(
  config,
  facilityId,
  dateStr
) {
  const baseUrl =
    config?.attendanceUrl ||
    "https://www.hug-ayumu.link/hug/wm/attendance.php";

  const url =
    new URL(baseUrl);

  url.searchParams.set(
    "mode",
    "detail"
  );

  url.searchParams.set(
    "f_id",
    normalizeId(
      facilityId
    )
  );

  url.searchParams.set(
    "date",
    normalizeId(
      dateStr
    )
  );

  return url.toString();
}

async function waitForWebviewLoad(
  webview,
  timeoutMs
) {
  return new Promise(
    (resolve, reject) => {
      let timer = null;

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
        }

        webview.removeEventListener?.(
          "did-finish-load",
          onFinish
        );

        webview.removeEventListener?.(
          "did-fail-load",
          onFail
        );
      };

      const onFinish = () => {
        cleanup();
        resolve();
      };

      const onFail = (event) => {
        if (
          Number(
            event?.errorCode
          ) === -3
        ) {
          return;
        }

        cleanup();

        reject(
          new Error(
            event?.errorDescription ||
            "HUG WebViewの読込に失敗しました"
          )
        );
      };

      webview.addEventListener?.(
        "did-finish-load",
        onFinish
      );

      webview.addEventListener?.(
        "did-fail-load",
        onFail
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

async function loadAttendanceDetail({
  helpers,
  config,
  facilityId,
  dateStr,
}) {
  const webview =
    await helpers.getHugWebview();

  const targetUrl =
    buildAttendanceUrl(
      config,
      facilityId,
      dateStr
    );

  const loadTimeoutMs =
    Number(
      config?.loadTimeoutMs
    ) > 0
      ? Number(
          config.loadTimeoutMs
        )
      : 15000;

  const currentUrl =
    webview.getURL?.() ||
    webview.getAttribute?.(
      "src"
    ) ||
    "";

  const finishPromise =
    waitForWebviewLoad(
      webview,
      loadTimeoutMs
    );

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

  const ready =
    await helpers.executeFunctionInWebview({
      webview,
      timeoutMs:
        loadTimeoutMs,
      functionText: `
        async function ({
          facilityId,
          dateStr,
          tableSelector,
          timeoutMs,
        }) {
          const startedAt =
            Date.now();

          while (
            Date.now() -
              startedAt <
            timeoutMs
          ) {
            const url =
              new URL(
                location.href
              );

            const table =
              document.querySelector(
                tableSelector
              );

            const ready =
              document.readyState ===
                "complete" &&
              url.searchParams.get(
                "f_id"
              ) ===
                String(
                  facilityId
                ) &&
              url.searchParams.get(
                "date"
              ) ===
                String(
                  dateStr
                ) &&
              Boolean(table);

            if (ready) {
              return {
                success: true,
                pageUrl:
                  location.href,
              };
            }

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  50
                )
            );
          }

          return {
            success: false,
            error:
              "HUG出席詳細DOMの準備を確認できませんでした",
            pageUrl:
              location.href,
            readyState:
              document.readyState,
          };
        }
      `,
      args: [
        {
          facilityId,
          dateStr,
          tableSelector:
            config?.tableSelector ||
            "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)",
          timeoutMs:
            loadTimeoutMs,
        },
      ],
    });

  if (!ready?.success) {
    throw new Error(
      ready?.error ||
      "HUG出席詳細DOMの準備を確認できませんでした"
    );
  }

  return webview;
}

exports.executeAttendanceAction =
  async function executeAttendanceAction({
    input,
    helpers,
    config,
  }) {
    const action =
      String(
        config?.action ||
        input?.action ||
        ""
      );

    const facilityId =
      normalizeId(
        input?.facilityId
      );

    const dateStr =
      normalizeId(
        input?.dateStr
      );

    const childId =
      normalizeId(
        input?.childId
      );

    const recordId =
      normalizeId(
        input?.recordId
      );

    if (
      action !== "enter" &&
      action !== "leave"
    ) {
      throw new Error(
        `未対応の入退室種別です: ${action}`
      );
    }

    if (!facilityId) {
      throw new Error(
        "施設IDがありません"
      );
    }

    if (!dateStr) {
      throw new Error(
        "日付がありません"
      );
    }

    if (!childId) {
      throw new Error(
        "児童IDがありません"
      );
    }

    const mailMode =
      config?.mailMode ||
      "no_mail";

    const mailFlg =
      mailMode ===
      "no_mail"
        ? 0
        : (
            Number(
              input?.mailFlg
            ) === 1
              ? 1
              : 0
          );

    const webview =
      await loadAttendanceDetail({
        helpers,
        config,
        facilityId,
        dateStr,
      });

    const result =
      await helpers.executeFunctionInWebview({
        webview,
        timeoutMs:
          Number(
            config
              ?.attendanceActionCompletionTimeoutMs
          ) +
            Number(
              config
                ?.mailDialogTimeoutMs
            ) +
            5000 ||
          30000,
        functionText: `
          async function ({
            action,
            childId,
            recordId,
            mailFlg,
            config,
          }) {
            const functionName =
              config.functionName;

            const cellIdPrefix =
              config.cellIdPrefix;

            const selectorTemplate =
              config.selectorTemplate;

            const detectMailDialog =
              Boolean(
                config.detectMailDialog
              ) &&
              Number(
                mailFlg
              ) === 1;

            const mailDialogSelector =
              config.mailDialogSelector ||
              "#addtend_dialog_mail";

            const mailDialogButtonSelector =
              config.mailDialogButtonSelector ||
              ''.send_mail_button[data-send_mail="{{sendMail}}"]'';

            const mailDialogTimeoutMs =
              Number(
                config.mailDialogTimeoutMs
              ) > 0
                ? Number(
                    config.mailDialogTimeoutMs
                  )
                : 10000;

            const completionTimeoutMs =
              Number(
                config.attendanceActionCompletionTimeoutMs
              ) > 0
                ? Number(
                    config.attendanceActionCompletionTimeoutMs
                  )
                : 12000;

            const label =
              action === "leave"
                ? "退室"
                : "入室";

            const isVisible =
              (element) => {
                if (!element) {
                  return false;
                }

                const style =
                  window.getComputedStyle(
                    element
                  );

                const rect =
                  element.getBoundingClientRect();

                return (
                  style.display !==
                    "none" &&
                  style.visibility !==
                    "hidden" &&
                  Number(
                    style.opacity ||
                    1
                  ) !== 0 &&
                  rect.width > 0 &&
                  rect.height > 0
                );
              };

            const extractIdsFromOnclick =
              (onclick) => {
                const text =
                  String(
                    onclick ||
                    ""
                  );

                const pattern =
                  action ===
                  "leave"
                    ? /sendLeaveMail\\\\s*\\\\(\\\\s*[''"]?([^''",)\\\\s]+)[''"]?\\\\s*,\\\\s*([^,]+)\\\\s*,\\\\s*([^,]+)/i
                    : /sendEnterMail\\\\s*\\\\(\\\\s*[''"]?([^''",)\\\\s]+)[''"]?\\\\s*,\\\\s*([^,]+)\\\\s*,\\\\s*([^,]+)/i;

                const match =
                  text.match(
                    pattern
                  );

                if (!match) {
                  return null;
                }

                return {
                  recordId:
                    String(
                      match[1]
                    ).trim(),
                  isMail:
                    Number(
                      String(
                        match[2]
                      ).trim()
                    ),
                  childId:
                    String(
                      match[3]
                    )
                      .trim()
                      .replace(
                        /^[''"]|[''"]$/g,
                        ""
                      ),
                };
              };

            let resolvedRecordId =
              String(
                recordId ||
                ""
              ).trim();

            let button = null;

            if (
              resolvedRecordId &&
              selectorTemplate
            ) {
              const selector =
                selectorTemplate.replace(
                  /\\\\{\\\\{\\\\s*recordId\\\\s*\\\\}\\\\}/g,
                  resolvedRecordId
                );

              button =
                document.querySelector(
                  selector
                );
            }

            if (!button) {
              const candidates =
                Array.from(
                  document.querySelectorAll(
                    "button[onclick*=''" +
                      functionName +
                      "'']"
                  )
                );

              for (
                const candidate of
                candidates
              ) {
                const parsed =
                  extractIdsFromOnclick(
                    candidate.getAttribute(
                      "onclick"
                    )
                  );

                if (
                  parsed &&
                  String(
                    parsed.childId
                  ) ===
                    String(
                      childId
                    )
                ) {
                  button =
                    candidate;

                  resolvedRecordId =
                    parsed.recordId ||
                    resolvedRecordId;

                  break;
                }
              }
            }

            if (!button) {
              return {
                success: false,
                error:
                  label +
                  "ボタンが見つかりません",
                recordId:
                  resolvedRecordId ||
                  null,
                childId,
                pageUrl:
                  location.href,
              };
            }

            const onclickCode =
              button.getAttribute(
                "onclick"
              ) ||
              "";

            const parsedButton =
              extractIdsFromOnclick(
                onclickCode
              );

            if (
              parsedButton?.childId &&
              String(
                parsedButton.childId
              ) !==
                String(
                  childId
                )
            ) {
              return {
                success: false,
                error:
                  "児童ID不一致: expected=" +
                  childId +
                  ", actual=" +
                  parsedButton.childId,
                pageUrl:
                  location.href,
              };
            }

            resolvedRecordId =
              parsedButton?.recordId ||
              resolvedRecordId;

            const cellId =
              cellIdPrefix +
              resolvedRecordId;

            const waitAndApplyMailChoice =
              () =>
                new Promise(
                  (resolve) => {
                    const startedAt =
                      Date.now();

                    let finished =
                      false;

                    let observer =
                      null;

                    let timer =
                      null;

                    const finish =
                      (value) => {
                        if (
                          finished
                        ) {
                          return;
                        }

                        finished =
                          true;

                        observer?.disconnect();

                        if (timer) {
                          clearTimeout(
                            timer
                          );
                        }

                        resolve(
                          value
                        );
                      };

                    const tryApply =
                      () => {
                        const dialog =
                          document.querySelector(
                            mailDialogSelector
                          );

                        if (
                          !dialog
                        ) {
                          return false;
                        }

                        const wrapper =
                          dialog.closest(
                            ".ui-dialog"
                          );

                        if (
                          !isVisible(
                            wrapper ||
                            dialog
                          )
                        ) {
                          return false;
                        }

                        const selector =
                          mailDialogButtonSelector.replace(
                            /\\\\{\\\\{\\\\s*sendMail\\\\s*\\\\}\\\\}/g,
                            String(
                              mailFlg
                            )
                          );

                        const target =
                          dialog.querySelector(
                            selector
                          );

                        if (
                          !target ||
                          target.disabled
                        ) {
                          return false;
                        }

                        const value = {
                          detected:
                            true,
                          autoSelected:
                            true,
                          sendMail:
                            Number(
                              mailFlg
                            ),
                          text:
                            (
                              target.textContent ||
                              ""
                            ).trim(),
                          dialogId:
                            dialog.id,
                          detectedAfterMs:
                            Date.now() -
                            startedAt,
                        };

                        target.click();

                        finish(
                          value
                        );

                        return true;
                      };

                    observer =
                      new MutationObserver(
                        tryApply
                      );

                    observer.observe(
                      document.body ||
                        document.documentElement,
                      {
                        childList:
                          true,
                        subtree:
                          true,
                        attributes:
                          true,
                        attributeFilter:
                          [
                            "style",
                            "class",
                            "aria-hidden",
                          ],
                      }
                    );

                    tryApply();

                    timer =
                      setTimeout(
                        () => {
                          const dialog =
                            document.querySelector(
                              mailDialogSelector
                            );

                          const wrapper =
                            dialog?.closest(
                              ".ui-dialog"
                            ) ||
                            null;

                          finish({
                            detected:
                              false,
                            autoSelected:
                              false,
                            reason:
                              "hug-mail-dialog-not-opened",
                            waitedMs:
                              Date.now() -
                              startedAt,
                            dialogExists:
                              Boolean(
                                dialog
                              ),
                            dialogVisible:
                              Boolean(
                                dialog &&
                                isVisible(
                                  wrapper ||
                                  dialog
                                )
                              ),
                            pageUrl:
                              location.href,
                          });
                        },
                        mailDialogTimeoutMs
                      );
                  }
                );

            const mailDialogPromise =
              detectMailDialog
                ? waitAndApplyMailChoice()
                : Promise.resolve({
                    detected:
                      false,
                    autoSelected:
                      false,
                    skipped:
                      true,
                    reason:
                      "mail-dialog-detection-disabled",
                  });

            button.click();

            const mailDialog =
              await mailDialogPromise;

            if (
              detectMailDialog &&
              !mailDialog?.detected
            ) {
              return {
                success: false,
                mode:
                  "dom-button-click-mutation-observer",
                action,
                recordId:
                  resolvedRecordId,
                childId,
                mailDialog,
                error:
                  "HUG側のメール通知モーダルを検知できませんでした。HUG本体の処理は開始されています。",
                pageUrl:
                  location.href,
              };
            }

            const completion =
              await new Promise(
                (resolve) => {
                  const startedAt =
                    Date.now();

                  let finished =
                    false;

                  let observer =
                    null;

                  let timer =
                    null;

                  const finish =
                    (value) => {
                      if (
                        finished
                      ) {
                        return;
                      }

                      finished =
                        true;

                      observer?.disconnect();

                      if (
                        timer
                      ) {
                        clearTimeout(
                          timer
                        );
                      }

                      resolve(
                        value
                      );
                    };

                  const check =
                    () => {
                      const currentCell =
                        document.getElementById(
                          cellId
                        );

                      if (
                        !currentCell
                      ) {
                        return false;
                      }

                      const remainingButton =
                        currentCell.querySelector(
                          "button[onclick*=''" +
                            functionName +
                            "'']"
                        );

                      if (
                        !remainingButton
                      ) {
                        finish({
                          completed:
                            true,
                          completedAfterMs:
                            Date.now() -
                            startedAt,
                          cellId,
                          cellText:
                            (
                              currentCell.textContent ||
                              ""
                            ).trim(),
                          pageUrl:
                            location.href,
                        });

                        return true;
                      }

                      return false;
                    };

                  observer =
                    new MutationObserver(
                      check
                    );

                  observer.observe(
                    document.body ||
                      document.documentElement,
                    {
                      childList:
                        true,
                      subtree:
                        true,
                      characterData:
                        true,
                      attributes:
                        true,
                      attributeFilter:
                        [
                          "style",
                          "class",
                          "disabled",
                        ],
                    }
                  );

                  check();

                  timer =
                    setTimeout(
                      () => {
                        const currentCell =
                          document.getElementById(
                            cellId
                          );

                        const remainingButton =
                          currentCell?.querySelector(
                            "button[onclick*=''" +
                              functionName +
                              "'']"
                          );

                        finish({
                          completed:
                            !remainingButton &&
                            Boolean(
                              currentCell
                            ),
                          reason:
                            "attendance-action-completion-timeout",
                          waitedMs:
                            Date.now() -
                            startedAt,
                          cellId,
                          cellText:
                            (
                              currentCell?.textContent ||
                              ""
                            ).trim(),
                          pageUrl:
                            location.href,
                        });
                      },
                      completionTimeoutMs
                    );
                }
              );

            if (
              !completion?.completed
            ) {
              return {
                success: false,
                action,
                recordId:
                  resolvedRecordId,
                childId,
                mailDialog,
                completion,
                error:
                  label +
                  "処理の完了を確認できませんでした",
                pageUrl:
                  location.href,
              };
            }

            return {
              success: true,
              mode:
                "dom-button-click-mutation-observer",
              action,
              kind:
                action,
              recordId:
                resolvedRecordId,
              rId:
                resolvedRecordId,
              childId,
              buttonInfo: {
                id:
                  button.id ||
                  null,
                className:
                  button.className ||
                  "",
                text:
                  (
                    button.textContent ||
                    ""
                  ).trim(),
                onclick:
                  onclickCode,
                outerHTML:
                  (
                    button.outerHTML ||
                    ""
                  ).slice(
                    0,
                    500
                  ),
              },
              mailDialog,
              completion,
              mailDialogDetected:
                Boolean(
                  mailDialog?.detected
                ),
              mailDialogAutoSelected:
                Boolean(
                  mailDialog?.autoSelected
                ),
              attendanceActionCompleted:
                true,
              selectedSendMail:
                Number(
                  mailFlg
                ),
              pageUrl:
                location.href,
              statusMessage:
                "HUG本体の" +
                label +
                "処理を開始しました。",
            };
          }
        `,
        args: [
          {
            action,
            childId,
            recordId,
            mailFlg,
            config,
          },
        ],
      });

    if (
      !result?.success
    ) {
      throw new Error(
        result?.error ||
        `${
          action === "leave"
            ? "退室"
            : "入室"
        }処理に失敗しました`
      );
    }

    return {
      ...result,
      success: true,
      mailFlg,
      mail_flg:
        mailFlg,
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
