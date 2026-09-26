import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { tryNativeEnter } from "../update/nativeDelegateInWebview.js";

export const ENTER_NO_MAIL_FLOW_KEY = "attendance_enter_no_mail";

export async function performEnterNoMail(item, ctx = {}) {
  if (!item?.enterOnclick) {
    throw new Error("入室 onclick がありません");
  }

  if (
    isAfternoonEnterHeldUntilHalfTime(
      item.hugAlertPref || { amPmFlag: 0 },
      getHalfTime(),
      new Date()
    )
  ) {
    throw new Error(
      `午後枠のためハーフタイム（${getHalfTime()}）まで入室できません`
    );
  }

  const webview =
    ctx.webview || (await getHugWebviewForCache());

  if (!webview) {
    throw new Error(
      "入室処理用の HUG webview を取得できませんでした"
    );
  }

  const result = await tryNativeEnter(
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
    flowKey: ENTER_NO_MAIL_FLOW_KEY,
    mail_flg: null,
    success: true,
  };
}
