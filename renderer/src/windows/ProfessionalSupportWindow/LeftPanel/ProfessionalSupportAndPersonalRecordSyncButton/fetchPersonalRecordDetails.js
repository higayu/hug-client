/**
 * 個人記録一覧の編集ボタン onclick から location.href を取り出し、
 * HUG_WM_BASE_URL を基準に編集画面を GET して本文(note)と記録者を取得する。
 *
 * fetchPersonalRecordList.js の成功実装と同じく、HUG の Cookie/セッションを
 * 引き継ぐため「1回の webview.executeJavaScript() の中」で詳細GETまで完結させる。
 */
export async function fetchPersonalRecordDetails(
  webview,
  records,
) {
  if (!webview) {
    return {
      ok: false,
      error: 'webview がありません。',
      records: [],
    }
  }

  if (!Array.isArray(records) || records.length === 0) {
    return {
      ok: true,
      records: [],
      detailCount: 0,
      errorCount: 0,
      permissionErrorCount: 0,
      skippedCount: 0,
    }
  }

  const normalizeConditionText = (value) =>
    String(value ?? '')
      .replace(/\s+/g, '')
      .trim()

  const getSkipReason = (record) => {
    const attendance = normalizeConditionText(
      record?.attendance,
    )
    const status = normalizeConditionText(
      record?.status,
    )

    if (
      attendance === '欠席' ||
      attendance.startsWith('欠席(')
    ) {
      return attendance.includes(
        '欠席時対応加算を取らない',
      )
        ? '欠席（欠席時対応加算を取らない）'
        : '欠席'
    }

    if (status === '未作成') {
      return '状態が未作成'
    }

    return ''
  }

  const targets = records.map(
    (record, index) => ({
      index,

      // 一覧POST結果から取得した button.edit の onclick を最優先する。
      // 例:
      // location.href='contact_book.php?mode=edit&id=46961&cal_date=2026-09-30&c_id=541'
      editSource:
        record?.editSource ??
        record?.editOnclick ??
        record?.editPath ??
        record?.editUrl ??
        '',

      skipReason: getSkipReason(record),
    }),
  )

  const script = `
    (async () => {
      const TARGETS = ${JSON.stringify(targets)};
      const HUG_WM_BASE_URL =
        "https://www.hug-ayumu.link/hug/wm/";

      const parseEditPath = (onclick) => {
        const source = String(
          onclick || ""
        ).trim();

        if (!source) {
          return "";
        }

        const match = source.match(
          /location\\.href\\s*=\\s*['"]([^'"]+)['"]/i
        );

        if (match?.[1]) {
          return match[1];
        }

        if (
          source.includes(
            "contact_book.php"
          )
        ) {
          return source;
        }

        return "";
      };

      const isLoginPage = (
        doc,
        html
      ) =>
        doc.querySelector(
          'input[name="username"]'
        ) !== null ||
        (doc.title || "").includes(
          "ログイン"
        ) ||
        String(
          html || ""
        ).includes(
          "login.php"
        );

      const getPermissionErrorMessage = (
        doc
      ) => {
        const cautionBox =
          doc.querySelector(
            ".caution-box.print"
          );

        if (!cautionBox) {
          return null;
        }

        const cautionTitle =
          cautionBox.querySelector(
            "h4.caution-title"
          );

        const text = (
          cautionTitle?.textContent ||
          cautionBox.textContent ||
          ""
        ).trim();

        if (
          text.includes(
            "編集権限がありません"
          ) ||
          text.includes(
            "権限がありません"
          ) ||
          text.includes(
            "編集権限がない"
          )
        ) {
          return (
            text ||
            "編集権限がありません"
          );
        }

        return null;
      };

      const isPermissionErrorMessage = (
        message
      ) => {
        const text = String(
          message || ""
        );

        return (
          text.includes(
            "編集権限"
          ) ||
          text.includes(
            "権限がありません"
          ) ||
          text.includes(
            "編集権限がない"
          )
        );
      };

      const fetchContactBookDetail =
        async (
          editSource
        ) => {
          const editPath =
            parseEditPath(
              editSource
            );

          if (!editPath) {
            throw new Error(
              "編集ボタンのonclickから編集URLを取得できませんでした"
            );
          }

          const editUrl =
            new URL(
              editPath,
              HUG_WM_BASE_URL
            ).href;

          console.log(
            "[HUG WM] 個人記録 編集画面fetch開始:",
            editUrl
          );

          const response =
            await fetch(
              editUrl,
              {
                method: "GET",
                credentials:
                  "include",
                cache:
                  "no-store"
              }
            );

          if (!response.ok) {
            throw new Error(
              "編集HTML取得エラー: " +
                response.status
            );
          }

          const html =
            await response.text();

          const editDoc =
            new DOMParser()
              .parseFromString(
                html,
                "text/html"
              );

          if (
            isLoginPage(
              editDoc,
              html
            )
          ) {
            throw new Error(
              "ログインページが返されました。HUGへのログイン状態を確認してください"
            );
          }

          const permissionErrorMessage =
            getPermissionErrorMessage(
              editDoc
            );

          if (
            permissionErrorMessage
          ) {
            throw new Error(
              permissionErrorMessage
            );
          }

          // -------------------------
          // 個人記録本文
          // -------------------------
          const textarea =
            editDoc.querySelector(
              'textarea[name="note"][data-field-key="note"]'
            );

          if (!textarea) {
            throw new Error(
              "note の textarea が見つかりませんでした"
            );
          }

          const note = (
            textarea.value || ""
          ).trim();

          // -------------------------
          // 記録者
          // -------------------------
          const recordStaffSelect =
            editDoc.querySelector(
              'select[name="record_staff"]'
            );

          let recordStaffId = null;
          let recordStaffName = "";

          if (
            recordStaffSelect
          ) {
            const rawStaffId =
              String(
                recordStaffSelect.value ??
                  ""
              ).trim();

            if (
              rawStaffId !== ""
            ) {
              const parsedStaffId =
                Number(
                  rawStaffId
                );

              recordStaffId =
                Number.isNaN(
                  parsedStaffId
                )
                  ? rawStaffId
                  : parsedStaffId;
            }

            const selectedOption =
              recordStaffSelect
                .options[
                  recordStaffSelect
                    .selectedIndex
                ];

            recordStaffName =
              (
                selectedOption
                  ?.textContent ||
                ""
              ).trim();
          }

          console.log(
            "[HUG WM] 個人記録 詳細取得:",
            {
              editUrl,
              recordStaffId,
              recordStaffName,
              note
            }
          );

          return {
            editPath,
            editUrl,
            note,
            recordStaffId,
            recordStaffName
          };
        };

      const results = [];

      for (
        const target of TARGETS
      ) {
        if (
          target.skipReason
        ) {
          results.push({
            index:
              target.index,

            editPath: "",
            editUrl: "",

            note: null,

            recordStaffId:
              null,

            recordStaffName:
              "",

            noteError: null,

            permissionError:
              false,

            detailSkipped:
              true,

            detailSkipReason:
              target.skipReason
          });

          continue;
        }

        try {
          const detail =
            await fetchContactBookDetail(
              target.editSource
            );

          results.push({
            index:
              target.index,

            editPath:
              detail.editPath,

            editUrl:
              detail.editUrl,

            note:
              detail.note,

            recordStaffId:
              detail.recordStaffId,

            recordStaffName:
              detail.recordStaffName,

            noteError: null,

            permissionError:
              false,

            detailSkipped:
              false,

            detailSkipReason:
              ""
          });

          console.log(
            "[HUG WM] 個人記録 詳細取得成功:",
            {
              index:
                target.index,

              editUrl:
                detail.editUrl,

              recordStaffId:
                detail.recordStaffId,

              recordStaffName:
                detail.recordStaffName,

              note:
                detail.note
            }
          );
        } catch (
          noteErr
        ) {
          const noteError =
            noteErr &&
            noteErr.message
              ? String(
                  noteErr.message
                )
              : String(
                  noteErr
                );

          const permissionError =
            isPermissionErrorMessage(
              noteError
            );

          results.push({
            index:
              target.index,

            editPath: "",
            editUrl: "",

            note: null,

            recordStaffId:
              null,

            recordStaffName:
              "",

            noteError,

            permissionError,

            detailSkipped:
              false,

            detailSkipReason:
              ""
          });

          console.warn(
            "[HUG WM] 個人記録 詳細取得エラー:",
            {
              index:
                target.index,

              error:
                noteError
            }
          );
        }
      }

      return {
        ok: true,

        results,

        detailCount:
          results.filter(
            (row) =>
              row.note !== null
          ).length,

        errorCount:
          results.filter(
            (row) =>
              Boolean(
                row.noteError
              )
          ).length,

        permissionErrorCount:
          results.filter(
            (row) =>
              row.permissionError
          ).length,

        skippedCount:
          results.filter(
            (row) =>
              row.detailSkipped
          ).length
      };
    })()
  `

  try {
    const detailResult =
      await webview.executeJavaScript(
        script,
        true,
      )

    if (!detailResult?.ok) {
      return {
        ok: false,
        error:
          detailResult?.error ??
          '個人記録本文の取得に失敗しました。',
        records,
      }
    }

    const detailsByIndex = new Map(
      (
        detailResult.results ?? []
      ).map((row) => [
        Number(row.index),
        row,
      ]),
    )

    const mergedRecords =
      records.map(
        (record, index) => {
          const detail =
            detailsByIndex.get(
              index,
            )

          if (!detail) {
            return record
          }

          return {
            ...record,

            editPath:
              detail.editPath ??
              record.editPath ??
              '',

            editUrl:
              detail.editUrl ??
              record.editUrl ??
              '',

            note:
              detail.note,

            // 記録者ID
            recordStaffId:
              detail.recordStaffId ??
              record.recordStaffId ??
              null,

            // 記録者名
            recordStaffName:
              detail.recordStaffName ??
              record.recordStaffName ??
              '',

            noteError:
              detail.noteError ??
              '',

            permissionError:
              Boolean(
                detail.permissionError,
              ),

            detailSkipped:
              Boolean(
                detail.detailSkipped,
              ),

            detailSkipReason:
              detail.detailSkipReason ??
              '',
          }
        },
      )

    console.log(
      '[HUG WM] 個人記録 詳細取得後 records:',
      mergedRecords,
    )

    return {
      ...detailResult,
      records:
        mergedRecords,
    }
  } catch (error) {
    console.error(
      '[ProfessionalSupportWindow] 個人記録本文 executeJavaScript エラー:',
      error,
    )

    return {
      ok: false,
      error:
        error?.message ??
        String(error),
      records,
    }
  }
}