/**
 * 入退室後の利用者一覧再取得。
 *
 * attendance_fetch_today_users はWebAutomation V2へ移行済みのため、
 * ここでも旧fetchAttendanceViaHugTabを使用せず executeFlowV2() に統一する。
 */

import { executeFlowV2 } from "@/components/WebAutomationV2";
import {
  setExtractedData,
  setTableData,
} from "@/store/slices/attendanceSlice.js";

const sleep =
  (ms) =>
    new Promise(
      (resolve) =>
        setTimeout(resolve, ms)
    );

const TIME_RE =
  /^\d{1,2}:\d{2}$/;

function findTargetRow(
  extracted,
  targetChildrenId
) {
  if (
    !targetChildrenId ||
    !Array.isArray(
      extracted?.data
    )
  ) {
    return null;
  }

  return (
    extracted.data.find(
      (row) =>
        String(
          row?.children_id ||
          ""
        ) ===
        String(
          targetChildrenId
        ),
    ) || null
  );
}

function isAttendanceActionReflected(
  row,
  action
) {
  if (!row) {
    return false;
  }

  if (action === "enter") {
    const text =
      String(
        row.column5 || ""
      ).trim();

    const html =
      String(
        row.column5Html || ""
      );

    return (
      TIME_RE.test(text) ||
      !html.includes(
        "sendEnterMail"
      )
    );
  }

  if (action === "leave") {
    const text =
      String(
        row.column6 || ""
      ).trim();

    const html =
      String(
        row.column6Html || ""
      );

    return (
      TIME_RE.test(text) ||
      (
        Boolean(
          row.column6Html
        ) &&
        !html.includes(
          "sendLeaveMail"
        )
      )
    );
  }

  return true;
}

export async function runAttendanceUpdate({
  facilityId,
  dateStr,
  dispatch,
  updateAppState,
  silent = true,
  targetChildrenId = null,
  action = "",
  verifyUpdated = false,
  retryCount = 5,
  retryDelayMs = 500,
}) {
  const maxAttempts =
    verifyUpdated
      ? Math.max(
          1,
          Number(
            retryCount
          ) || 1
        )
      : 1;

  let lastResult = null;
  let lastExtracted = null;
  let reflected =
    !verifyUpdated;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    try {
      const result =
        await executeFlowV2(
          "attendance_fetch_today_users",
          {
            facilityId,
            dateStr,
          },
        );

      lastResult =
        result;

      const extracted =
        result?.extracted;

      lastExtracted =
        extracted;

      if (
        !extracted?.success
      ) {
        throw new Error(
          extracted?.error ||
          "利用者一覧の解析に失敗しました"
        );
      }

      if (!verifyUpdated) {
        reflected = true;
        break;
      }

      const targetRow =
        findTargetRow(
          extracted,
          targetChildrenId
        );

      reflected =
        isAttendanceActionReflected(
          targetRow,
          action
        );

      if (!silent) {
        console.log(
          "[ATTENDANCE V2] 更新反映確認",
          {
            attempt,
            maxAttempts,
            targetChildrenId,
            action,
            reflected,
            column5:
              targetRow?.column5,
            column6:
              targetRow?.column6,
          }
        );
      }

      if (reflected) {
        break;
      }
    } catch (error) {
      if (
        attempt >=
        maxAttempts
      ) {
        throw error;
      }
    }

    if (
      attempt <
      maxAttempts
    ) {
      await sleep(
        retryDelayMs
      );
    }
  }

  if (!lastResult) {
    throw new Error(
      "利用者一覧の更新に失敗しました"
    );
  }

  if (
    verifyUpdated &&
    !reflected
  ) {
    throw new Error(
      `HUG側の${
        action === "leave"
          ? "退室"
          : "入室"
      }更新が利用者一覧へ反映されるまで確認できませんでした`
    );
  }

  const extracted =
    lastExtracted;

  const tableData = {
    success: true,
    html:
      lastResult.html,
    rowCount:
      lastResult.rowCount,
    pageTitle:
      lastResult.pageTitle,
    pageUrl:
      lastResult.pageUrl,
    facility_id:
      facilityId,
    date_str:
      dateStr,
  };

  dispatch(
    setTableData(
      tableData
    )
  );

  if (
    extracted?.success
  ) {
    dispatch(
      setExtractedData(
        extracted
      )
    );

    if (
      updateAppState
    ) {
      const attendanceData = {
        facilityId,
        dateStr,
        extractedAt:
          new Date()
            .toISOString(),
        rowCount:
          extracted.rowCount,
        data:
          extracted.data,
      };

      updateAppState({
        attendanceData,
      });

      if (
        typeof window !==
          "undefined" &&
        window.AppState
      ) {
        window.AppState.attendanceData =
          attendanceData;
      }
    }
  }

  if (!silent) {
    console.log(
      "[ATTENDANCE V2] runAttendanceUpdate 完了",
      {
        rowCount:
          extracted?.rowCount,
        reflected,
      }
    );
  }

  return {
    tableData,
    extracted,
    reflected,
  };
}
