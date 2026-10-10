// src/components/Sidebar/SelectChildrenList/TodayChildrenList/timeUtils.js

/**
 * TIME文字列を分に変換する
 *
 * 対応例:
 * - "09:30:00" → 570
 * - "09:30"    → 570
 * - "9:30"     → 570
 * - "1200"     → 720
 * - "930"      → 570
 */
export function timeToMinutes(time) {
  if (time == null || time === "") {
    return null
  }

  const value = String(time).trim()

  if (!value) {
    return null
  }

  // "HH:mm" / "HH:mm:ss"
  if (value.includes(":")) {
    const [hourText, minuteText = "0"] = value.split(":")
    const hour = Number(hourText)
    const minute = Number(minuteText)

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null
    }

    return hour * 60 + minute
  }

  // "1200" / "0930" / "930"
  const onlyNumber = value.replace(/\D/g, "")

  if (!onlyNumber) {
    return null
  }

  const normalized = onlyNumber.padStart(4, "0")
  const hour = Number(normalized.slice(0, -2))
  const minute = Number(normalized.slice(-2))

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }

  return hour * 60 + minute
}

/**
 * 午前児童判定
 *
 * 重要:
 * - support_start_time / support_end_time が両方ある場合のみ判定する
 * - support_end_time だけで午前扱いしない
 * - 開始時刻も終了時刻も午前帯の場合だけ「午前」とする
 */
export function isMorningChild(child) {
  const startMinutes = timeToMinutes(child?.support_start_time)
  const endMinutes = timeToMinutes(child?.support_end_time)

  if (startMinutes == null || endMinutes == null) {
    return false
  }

  return startMinutes < 12 * 60 && endMinutes <= 12 * 60
}