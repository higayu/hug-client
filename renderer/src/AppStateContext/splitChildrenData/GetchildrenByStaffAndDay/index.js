// src/hooks/useDataBase/splitChildrenData/GetchildrenByStaffAndDay/index.js

import { DAY_OF_WEEK_MASTER } from "@/utils/date/dateUtils.js"

/**
 * TIME値を表示・判定しやすい文字列に正規化する
 */
function normalizeTimeValue(value) {
  if (value == null || value === "") {
    return null
  }

  const text = String(value).trim()

  if (!text) {
    return null
  }

  if (text.includes(":")) {
    const [hourText, minuteText = "0", secondText = "0"] = text.split(":")

    const hour = Number(hourText)
    const minute = Number(minuteText)
    const second = Number(secondText)

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      Number.isNaN(second)
    ) {
      return null
    }

    return [
      String(hour).padStart(2, "0"),
      String(minute).padStart(2, "0"),
      String(second).padStart(2, "0"),
    ].join(":")
  }

  const digits = text.replace(/\D/g, "")

  if (!digits) {
    return null
  }

  const normalized = digits.padStart(4, "0")
  const hour = Number(normalized.slice(0, -2))
  const minute = Number(normalized.slice(-2))

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }

  return [
    String(hour).padStart(2, "0"),
    String(minute).padStart(2, "0"),
    "00",
  ].join(":")
}

/**
 * スタッフ・曜日で子ども一覧を取得（managers2 対応）
 * 新仕様：facility_id が追加され、プライマリキーに含まれる
 */
export async function GetchildrenByStaffAndDay({
  tables,
  staffId,
  weekdayId,
  facility_id = null,
}) {
  if (!tables) {
    console.error("❌ GetchildrenByStaffAndDay: テーブルデータが未定義です")
    return []
  }

  if (!weekdayId) {
    console.warn("⚠️ 対象曜日IDが取得できません:", weekdayId)
    return []
  }

  const {
    children = [],
    staffs = [],
    managers2 = [],
    pc = [],
    pc_to_children = [],
    pronunciation = [],
    children_type = [],
  } = tables

  console.group("🔗 [GetchildrenByStaffAndDay / managers2] JOIN処理開始")
  void 0
  void 0
  void 0

  const staffIdText = String(staffId)
  const weekdayIdNum = Number(weekdayId)
  const facilityIdText =
    facility_id == null || facility_id === "" ? null : String(facility_id)

  const weekdayObj = DAY_OF_WEEK_MASTER.find(
    (w) => Number(w.id) === weekdayIdNum
  )

  // ----------------------------------------
  // JOIN処理（managers2 前提）
  // ----------------------------------------
  const joined = managers2
    // 曜日ID一致のみ
    .filter((m) => Number(m.day_of_week_id) === weekdayIdNum)
    .filter(
      (m) =>
        facilityIdText === null || String(m.facility_id) === facilityIdText
    )
    .map((m) => {
      const child = children.find(
        (c) => String(c.id) === String(m.children_id)
      )

      const staff = staffs.find(
        (s) => String(s.id) === String(m.staff_id)
      )

      if (!child || !staff) {
        console.warn("⚠️ managers2 JOIN失敗:", {
          manager: m,
          childFound: Boolean(child),
          staffFound: Boolean(staff),
          children_id: m.children_id,
          staff_id: m.staff_id,
          facility_id: m.facility_id,
        })

        return null
      }

      // 削除済みの子どもは除外
      if (child.is_delete === 1) {
        return null
      }

      // PC JOIN
      const ptc = pc_to_children.find(
        (p) => String(p.children_id) === String(child.id)
      )

      const pcItem = ptc
        ? pc.find((p) => String(p.id) === String(ptc.pc_id))
        : null

      const pronun = pronunciation.find(
        (p) => String(p.id) === String(child.pronunciation_id)
      )

      const ctype = children_type.find(
        (t) => String(t.id) === String(child.children_type_id)
      )

      const supportStartTime = normalizeTimeValue(m.support_start_time)
      const supportEndTime = normalizeTimeValue(m.support_end_time)

      return {
        // children テーブル情報
        children_id: child.id,
        children_name: child.name,
        notes: child.notes ?? "",
        notes2: child.notes2 ?? "",
        personal_tmp: child.personal_tmp ?? "",
        pronunciation_id: child.pronunciation_id ?? null,
        is_delete: child.is_delete ?? 0,
        leaving_at: child.leaving_at ?? null,

        // staff テーブル情報
        staff_id: staff.id,
        staff_name: staff.name,

        // managers2 テーブル情報（facility_id を追加）
        facility_id: Number(m.facility_id), // ✅ 追加
        day_of_week_id: Number(m.day_of_week_id),
        priority: Number(m.priority ?? 0),
        support_start_time: supportStartTime,
        support_end_time: supportEndTime,

        // 表示用
        weekday_id: weekdayIdNum,
        weekday_name: weekdayObj?.label_jp ?? "",

        // children_type テーブル情報
        children_type_id: child.children_type_id,
        children_type_name: ctype?.name ?? "",

        // pronunciation テーブル情報
        children_pronunciation_id: child.pronunciation_id,
        children_pronunciation: pronun?.pronunciation ?? "",

        // pc / pc_to_children テーブル情報
        pc_id: pcItem?.id ?? null,
        pc_name: pcItem?.name ?? "",
        pc_day_of_week: ptc?.day_of_week ?? "",

        /** 専門的支援の利用日数（HUG取得前は null） */
        useSpeDate: null,
      }
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.children_name ?? "").localeCompare(
        String(b.children_name ?? ""),
        "ja"
      )
    )

  // ----------------------------------------
  // 自分の担当のみ
  // ----------------------------------------
  const myChildren = joined.filter(
    (c) => String(c.staff_id) === staffIdText
  )

  void 0
  
  // facility_id が含まれているか確認
  if (myChildren.length > 0) {
    void 0
  }

  void 0

  console.groupEnd()

  return myChildren
}
