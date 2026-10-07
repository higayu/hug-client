import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { formatYmdToHugInterviewDate } from "@/utils/professionalSupport/formatInterviewDate.js";
import { fetchProfessionalSupportUseDaysInWebview } from "./fetchProfessionalCheck";

/**
 * hugview の Cookie だけ使い、ページ遷移なしで利用日数を取得する
 * @param {{ childId: string|number, facilityId?: string|number, interviewDate?: string, currentYmd?: string }} opts
 */
export async function fetchProfessionalSupportUseDaysViaHugTab({
  childId,
  facilityId,
  interviewDate,
  currentYmd,
}) {
  const webview = await getHugWebviewForCache();

  const resolvedInterviewDate =
    interviewDate || formatYmdToHugInterviewDate(currentYmd);

  if (!facilityId) {
    return {
      ok: false,
      error: "施設ID（facilityId）が指定されていません",
    };
  }

  if (!resolvedInterviewDate) {
    return {
      ok: false,
      error: "面談日（interview_date）が指定されていません",
    };
  }

  return fetchProfessionalSupportUseDaysInWebview(webview, {
    childId: String(childId),
    facilityId: String(facilityId),
    interviewDate: resolvedInterviewDate,
  });
}
