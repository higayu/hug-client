import { executeFlowV2 } from "@/components/WebAutomationV2";

const CONTACT_BOOK_URL = "https://www.hug-ayumu.link/hug/wm/contact_book.php";

const normalizeChildName = (value) =>
  String(value ?? "")
    .replace(/^\[利用停止\]\s*/, "")
    .replace(/\s+/g, "")
    .trim();

const normalizeDate = (value) => {
  const text = String(value ?? "").trim();
  const match = text.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (!match) return "";
  return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
};

const adaptV2RecordForExistingSave = (record) => ({
  ...record,
  recordStaff:
    record?.recordStaff ??
    (record?.recordStaffId || record?.recordStaffName
      ? {
          value: record?.recordStaffId ?? "",
          text: record?.recordStaffName ?? "",
        }
      : undefined),
});

/**
 * 個人記録取得を WebAutomation V2 に統一する共通関数。
 * 保存処理側が期待している既存 records 形式へ変換して返す。
 */
export async function fetchPersonalRecordV2({
  childId,
  facilityId,
  yearMonth,
  dateStr = "",
}) {
  if (!childId) {
    return { ok: false, error: "児童IDが指定されていません" };
  }

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { ok: false, error: "yearMonth が YYYY-MM 形式ではありません" };
  }

  const [year, month] = yearMonth.split("-");

  const listResult = await executeFlowV2("personal_record_list_fetch", {
    facilityId,
    year,
    month,
  });

  const targetChild = Array.isArray(listResult?.hugChildren)
    ? listResult.hugChildren.find(
        (child) => String(child?.id) === String(childId)
      )
    : null;

  if (!targetChild) {
    throw new Error(
      `HUG児童一覧から対象児童を特定できませんでした。childId=${childId}`
    );
  }

  const targetChildName = normalizeChildName(targetChild?.name);
  const targetDate = normalizeDate(dateStr);

  const filteredListRecords = Array.isArray(listResult?.records)
    ? listResult.records.filter((record) => {
        if (normalizeChildName(record?.childName) !== targetChildName) {
          return false;
        }

        if (targetDate && normalizeDate(record?.date) !== targetDate) {
          return false;
        }

        return true;
      })
    : [];

  const detailResult = await executeFlowV2("personal_record_detail_fetch", {
    records: filteredListRecords,
  });

  const records = Array.isArray(detailResult?.records)
    ? detailResult.records.map(adaptV2RecordForExistingSave)
    : [];

  return {
    ...listResult,
    ...detailResult,
    ok: detailResult?.ok !== false,
    listUrl: listResult?.listUrl ?? CONTACT_BOOK_URL,
    rowCount: records.length,
    presentCount: records.filter(
      (record) => !String(record?.attendance ?? "").trim().startsWith("欠席")
    ).length,
    records,
  };
}
