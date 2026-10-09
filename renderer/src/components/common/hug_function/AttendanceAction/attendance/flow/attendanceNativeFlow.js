import { executeFlowV2 } from "@/components/WebAutomationV2";

/**
 * WebAutomation V2 に統一した入退室実行ラッパー。
 *
 * 実際のHUG DOM操作・メールモーダル監視・完了待機は
 * DB側の各Flowに保存された仮想JavaScriptが担当する。
 */
export async function executeAttendanceNativeFlow(
  flowKey,
  action,
  item,
  ctx = {},
) {
  if (!item) {
    throw new Error("入退室対象データがありません");
  }

  const facilityId =
    ctx.facilityId ??
    item.facilityId ??
    item.f_id ??
    "";

  const dateStr =
    ctx.dateStr ??
    item.date ??
    item.detailPageDate ??
    "";

  const recordId =
    item.r_id ??
    item.recordId ??
    "";

  const childId =
    item.c_id ??
    item.childId ??
    item.children_id ??
    "";

  if (!facilityId) {
    throw new Error("入退室処理に必要な facilityId がありません");
  }

  if (!dateStr) {
    throw new Error("入退室処理に必要な dateStr がありません");
  }

  if (!childId) {
    throw new Error("入退室処理に必要な childId がありません");
  }

  const mailFlg =
    Number(
      ctx.mailFlg ??
      ctx.mail_flg ??
      0
    ) === 1
      ? 1
      : 0;

  console.log("[Attendance V2] execute", {
    flowKey,
    action,
    recordId,
    childId,
    facilityId,
    dateStr,
    mailFlg,
  });

  const result =
    await executeFlowV2(
      flowKey,
      {
        action,
        recordId,
        childId,
        facilityId,
        dateStr,
        mailFlg,
      },
    );

  return {
    ...result,
    success: true,
    mode: "web-automation-v2",
    flowKey,
    ruleKey: flowKey,
    mail_flg: mailFlg,
    flow: null,
    step: null,
    rule: null,
  };
}

/**
 * 互換用。
 * V2ではFlow本体は executeFlowV2() 内で取得するため、
 * Renderer側から旧Flow/Step/Rule構造を返さない。
 */
export async function getAttendanceAutomationFlow(flowKey) {
  return {
    id: null,
    flow_key: String(flowKey || ""),
    is_active: 1,
    config_json: {
      engine: "WebAutomationV2",
    },
    steps: [],
  };
}
