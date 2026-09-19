import { performLeaveAction } from './performLeaveAction'

const parseLeaveButton = (column6Html) => {
  const html = String(column6Html ?? '')

  const match = html.match(
    /sendLeaveMail\s*\(\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*\)/,
  )

  if (!match) return null

  return {
    rId: Number(match[1]),
    isMail: Number(match[2]),
    childId: Number(match[3]),
    facilityId: Number(match[4]),
    attendFlg: Number(match[5]),
    linkage: Number(match[6]),
  }
}

const extractTime = (value) => {
  const text = String(value ?? '').trim()
  const match = text.match(/(\d{1,2}):(\d{1,2})/)

  if (!match) return ''

  return `${Number(match[1])}:${String(Number(match[2])).padStart(2, '0')}`
}

const getCurrentTimeText = () => {
  const now = new Date()
  return `${now.getHours()}:${now.getMinutes()}`
}

const extractPlanTimeDiv = (html, options = {}) => {
  const explicit = options.planTimeDiv ?? options.plan_time_div

  if (explicit !== undefined && explicit !== null && explicit !== '') {
    return explicit
  }

  const source = String(
    options.rowHtml ?? options.trHtml ?? options.attendanceRowHtml ?? html ?? '',
  )

  const match = source.match(/data-plan_time_div=["']([^"']*)["']/i)
  return match?.[1] ?? ''
}

const extractExtensionTimePlan = (html, options = {}) => {
  const explicit =
    options.extensionTimePlan ?? options.extension_time_plan

  if (explicit !== undefined && explicit !== null && explicit !== '') {
    return explicit
  }

  const source = String(
    options.rowHtml ?? options.trHtml ?? options.attendanceRowHtml ?? html ?? '',
  )

  const match = source.match(
    /data-extension_time_plan_flg=["']([^"']*)["']/i,
  )

  return match?.[1] || 0
}

export const clickExitButton = async (
  column6Html,
  targetChildId,
  options = {},
) => {
  console.group('[ATTENDANCE] clickExitButton START')

  try {
    const leaveButton = parseLeaveButton(column6Html)

    console.log('[ATTENDANCE] leaveButton:', leaveButton)
    console.log('[ATTENDANCE] targetChildId:', targetChildId)
    console.log('[ATTENDANCE] options:', options)

    if (!leaveButton) {
      throw new Error('退室ボタンの情報を解析できませんでした')
    }

    if (
      targetChildId !== null &&
      targetChildId !== undefined &&
      targetChildId !== '' &&
      Number(targetChildId) !== Number(leaveButton.childId)
    ) {
      throw new Error(
        `対象児童IDが一致しません。selected=${targetChildId}, button=${leaveButton.childId}`,
      )
    }

    const enterTime =
      extractTime(options.enterTime) ||
      extractTime(options.column5) ||
      extractTime(options.column5Html)

    if (!enterTime) {
      throw new Error('入室時間が取得できませんでした')
    }

    const date = String(options.dateStr ?? options.date ?? '').trim()

    if (!date) {
      throw new Error('対象日付が取得できませんでした')
    }

    // HUG本体と同様、分はゼロ埋めしない現在時刻でも受理される。
    // 例: 17:5
    const leaveTime = options.leaveTime || getCurrentTimeText()

    const facilityId = Number(
      leaveButton.facilityId || options.facilityId || 0,
    )

    if (!facilityId) {
      throw new Error('施設IDが取得できませんでした')
    }

    const result = await performLeaveAction({
      rId: leaveButton.rId,
      childId: leaveButton.childId,
      facilityId,
      date,
      enterTime,
      leaveTime,
      attendFlg: leaveButton.attendFlg,
      linkage: leaveButton.linkage,
      planTimeDiv: extractPlanTimeDiv(column6Html, options),
      extensionTimePlan: extractExtensionTimePlan(column6Html, options),
      changeAttendanceFlg:
        options.changeAttendanceFlg ?? options.change_attendance_flg ?? '',
      hiddenMailOnly:
        options.hiddenMailOnly ?? options.hidden_mail_only ?? '',
    })

    console.log('[ATTENDANCE] clickExitButton result:', result)

    return result
  } catch (error) {
    console.error('[ATTENDANCE] clickExitButton error:', error)

    return {
      success: false,
      cancelled: false,
      error: error?.message || '退室処理に失敗しました',
    }
  } finally {
    console.groupEnd()
  }
}

export default clickExitButton
