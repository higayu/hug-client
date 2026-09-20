// src/utils/dateUtils.js
// 日付関連のユーティリティ関数

// =====================================================
// day_of_week マスタ（唯一の正）
// DB仕様:
// 1=日, 2=月, 3=火, 4=水, 5=木, 6=金, 7=土
// =====================================================
export const DAY_OF_WEEK_MASTER = [
  { id: 1, label_jp: "日", label_en: "Sun", sort_order: 1 },
  { id: 2, label_jp: "月", label_en: "Mon", sort_order: 2 },
  { id: 3, label_jp: "火", label_en: "Tue", sort_order: 3 },
  { id: 4, label_jp: "水", label_en: "Wed", sort_order: 4 },
  { id: 5, label_jp: "木", label_en: "Thu", sort_order: 5 },
  { id: 6, label_jp: "金", label_en: "Fri", sort_order: 6 },
  { id: 7, label_jp: "土", label_en: "Sat", sort_order: 7 },
]

// =====================================================
// 内部ヘルパー：JS Date.getDay() → day_of_week.id
//
// JS:
// 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
//
// DB:
// 1=日, 2=月, 3=火, 4=水, 5=木, 6=金, 7=土
//
// そのため単純に +1 すれば一致する
// =====================================================
function jsDayToWeekdayId(jsDay) {
  if (
    !Number.isInteger(jsDay) ||
    jsDay < 0 ||
    jsDay > 6
  ) {
    return null
  }

  return jsDay + 1
}

// =====================================================
// 内部ヘルパー：日付文字列をローカル日付として生成
//
// new Date("2026-09-19") のような YYYY-MM-DD は
// 実行環境によってUTCとして解釈される可能性があるため、
// 年月日を分解してローカルタイムの Date を生成する。
// =====================================================
function parseLocalDate(dateStr) {
  if (!dateStr) {
    return null
  }

  // Date オブジェクトが渡された場合
  if (dateStr instanceof Date) {
    if (Number.isNaN(dateStr.getTime())) {
      return null
    }

    return new Date(
      dateStr.getFullYear(),
      dateStr.getMonth(),
      dateStr.getDate()
    )
  }

  if (typeof dateStr !== "string") {
    return null
  }

  // YYYY-MM-DD
  const match = dateStr.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  )

  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])

    const date = new Date(
      year,
      month - 1,
      day
    )

    // 2026-02-31 のような不正日付対策
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }

    return date
  }

  // その他の日時文字列は通常の Date として解釈
  const date = new Date(dateStr)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

// =====================================================
// 日付文字列から曜日オブジェクトを取得
// =====================================================
export function getWeekdayObjectFromDate(dateStr) {
  const date = parseLocalDate(dateStr)

  if (!date) {
    return null
  }

  const jsDay = date.getDay()
  const weekdayId = jsDayToWeekdayId(jsDay)

  if (weekdayId === null) {
    return null
  }

  return (
    DAY_OF_WEEK_MASTER.find(
      (weekday) => weekday.id === weekdayId
    ) ?? null
  )
}

// =====================================================
// 日付文字列から曜日IDを取得
//
// 例:
// 2026-09-20（日） -> 1
// 2026-09-21（月） -> 2
// 2026-09-26（土） -> 7
// =====================================================
export function getWeekdayIdFromDate(dateStr) {
  const date = parseLocalDate(dateStr)

  if (!date) {
    return null
  }

  return jsDayToWeekdayId(
    date.getDay()
  )
}

// =====================================================
// 今日（offset日後）の曜日IDを取得
//
// offset:
//  0 = 今日
//  1 = 明日
// -1 = 昨日
// =====================================================
export function getTodayWeekdayId(offset = 0) {
  const date = new Date()

  date.setDate(
    date.getDate() + offset
  )

  return jsDayToWeekdayId(
    date.getDay()
  )
}

// =====================================================
// 指定したオフセット日数後の日付文字列を取得
//
// 戻り値:
// YYYY-MM-DD
// =====================================================
export function getDateString(offset = 0) {
  const today = new Date()

  today.setDate(
    today.getDate() + offset
  )

  const year = today.getFullYear()
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0")

  const day = String(
    today.getDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

// =====================================================
// 表示用
// 日付から日本語の曜日ラベルを取得
//
// 例:
// 2026-09-20 -> "日"
// =====================================================
export function getWeekdayLabelFromDate(dateStr) {
  return (
    getWeekdayObjectFromDate(
      dateStr
    )?.label_jp ?? ""
  )
}

// =====================================================
// 曜日名 → weekdayId
//
// 対応:
// "日"
// "Sun"
// "sun"
// "SUN"
//
// 戻り値:
// 1 ～ 7
// 見つからない場合 null
// =====================================================
export function getWeekdayIdFromLabel(weekDay) {
  if (
    weekDay === null ||
    weekDay === undefined
  ) {
    return null
  }

  const normalizedWeekDay = String(
    weekDay
  ).trim()

  if (!normalizedWeekDay) {
    return null
  }

  const lower =
    normalizedWeekDay.toLowerCase()

  const match = DAY_OF_WEEK_MASTER.find(
    (weekday) =>
      weekday.label_jp ===
        normalizedWeekDay ||
      weekday.label_en?.toLowerCase() ===
        lower
  )

  return match?.id ?? null
}

// =====================================================
// weekdayId → 曜日オブジェクト
// =====================================================
export function getWeekdayObjectFromId(weekdayId) {
  const id = Number(weekdayId)

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    id > 7
  ) {
    return null
  }

  return (
    DAY_OF_WEEK_MASTER.find(
      (weekday) => weekday.id === id
    ) ?? null
  )
}

// =====================================================
// weekdayId → 日本語曜日ラベル
// =====================================================
export function getWeekdayLabelFromId(weekdayId) {
  return (
    getWeekdayObjectFromId(
      weekdayId
    )?.label_jp ?? ""
  )
}

// =====================================================
// weekdayId → 英語曜日ラベル
// =====================================================
export function getWeekdayEnglishLabelFromId(
  weekdayId
) {
  return (
    getWeekdayObjectFromId(
      weekdayId
    )?.label_en ?? ""
  )
}