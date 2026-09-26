import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { tryNativeLeave } from "../update/nativeDelegateInWebview.js";

export const LEAVE_NO_MAIL_FLOW_KEY =
  "attendance_leave_no_mail";

export async function performLeaveNoMail(item, ctx = {}) {
  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  const webview =
    ctx.webview || (await getHugWebviewForCache());

  if (!webview) {
    throw new Error(
      "退室処理用の HUG webview を取得できませんでした"
    );
  }

  const result = await tryNativeLeave(
    webview,
    item,
    {
      facilityId:
        ctx.facilityId ||
        item.facilityId ||
        item.f_id,
      dateStr:
        ctx.dateStr ||
        item.date ||
        item.detailPageDate,
    }
  );

  return {
    ...result,
    mode: "native-onclick",
    flowKey: LEAVE_NO_MAIL_FLOW_KEY,
    mail_flg: null,
    success: true,
  };
}
