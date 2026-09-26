import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { tryNativeLeave } from "../update/nativeDelegateInWebview.js";

export const LEAVE_WITH_MAIL_FLOW_KEY =
  "attendance_leave_with_mail";

export async function performLeaveWithMail(item, ctx = {}) {
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

  // renderer側で選択した通知有無を、HUG本体のメール確認ダイアログへ反映する。
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
      mailFlg:
        Number(ctx.mailFlg ?? ctx.mail_flg) === 1 ? 1 : 0,
    }
  );

  return {
    ...result,
    mode: "native-onclick",
    flowKey: LEAVE_WITH_MAIL_FLOW_KEY,
    mail_flg: Number(ctx.mailFlg ?? ctx.mail_flg) === 1 ? 1 : 0,
    success: true,
  };
}
