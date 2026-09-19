const HUG_BASE_URL = 'https://www.hug-ayumu.link/hug/wm'

const parseJsonResponse = async (response, label) => {
  const text = await response.text()

  console.log(`[ATTENDANCE] ${label} response`, {
    status: response.status,
    ok: response.ok,
    text,
  })

  if (!response.ok) {
    throw new Error(
      `${label} HTTP ${response.status}: ${text || '(response body empty)'}`,
    )
  }

  if (!text.trim()) {
    throw new Error(`${label} のサーバー応答が空です (${response.status})`)
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    console.error(`[ATTENDANCE] ${label} JSON parse error`, {
      status: response.status,
      text,
      error,
    })

    throw new Error(
      `${label} のサーバー応答がJSONではありません (${response.status}): ${text}`,
    )
  }
}

const appendValue = (params, key, value) => {
  params.append(
    key,
    value === null || value === undefined ? '' : String(value),
  )
}

const normalizeTime = (value) => {
  const text = String(value ?? '').trim()
  const match = text.match(/^(\d{1,2}):(\d{1,2})$/)

  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return {
    text,
    hour,
    minute,
  }
}

const getTimeDiff = (enterTime, leaveTime) => {
  const start = normalizeTime(enterTime)
  const end = normalizeTime(leaveTime)

  if (!start || !end) {
    throw new Error(
      `入退室時間の形式が不正です enter=${enterTime}, leave=${leaveTime}`,
    )
  }

  const startMinutes = start.hour * 60 + start.minute
  let endMinutes = end.hour * 60 + end.minute

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  const diffMinutes = endMinutes - startMinutes

  return {
    start,
    end,
    diffMinutes,
    intervalText: `${Math.floor(diffMinutes / 60)}時間${diffMinutes % 60}分`,
  }
}

const getEnterTimeAndProvidingType = async (rId) => {
  const params = new URLSearchParams()
  params.set('action', 'getEnterTimeAndProvidingType')
  params.set('r_id', String(rId))

  const url = `${HUG_BASE_URL}/ajax/ajax_attendance.php?${params.toString()}`

  console.log('[ATTENDANCE] getEnterTimeAndProvidingType request', {
    url,
    rId,
  })

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  return parseJsonResponse(response, '入室情報取得')
}

const requestExtensionDetail = async ({
  date,
  childId,
  facilityId,
  rId,
  enterTime,
  leaveTime,
  extensionTimePlan = 0,
  changeAttendanceFlg = '',
}) => {
  const params = new URLSearchParams()

  appendValue(params, 'mode', 'detail_setting')
  appendValue(params, 'date', date)
  appendValue(params, 'c_id', childId)
  appendValue(params, 'f_id', facilityId)

  // HUG本体 getDetailExtensionData() と同じPHP配列形式
  appendValue(params, 'form[0]', rId)
  appendValue(params, 'form[1]', enterTime)
  appendValue(params, 'form[2]', leaveTime)
  appendValue(params, 'form[3]', extensionTimePlan)
  appendValue(params, 'form[4]', '')
  appendValue(params, 'form[5]', 'detail')
  appendValue(params, 'form[6]', changeAttendanceFlg)

  console.log('[ATTENDANCE] ajax_extension POST entries', [
    ...params.entries(),
  ])

  const response = await fetch(
    `${HUG_BASE_URL}/ajax/ajax_extension.php`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: params.toString(),
    },
  )

  return parseJsonResponse(response, '延長支援確認')
}

const saveAttendance = async (dataList) => {
  const params = new URLSearchParams()

  const fields = [
    'date',
    'r_id',
    'c_id',
    'f_id',
    'hidden_mail_only',
    'attend_flg',
    'attendance_type',
    'providing_type',
    'linkage',
    'change_attendance_flg',
    'enter_time_hi',
    'leave_time_hi',
    's_hour',
    's_min',
    'e_hour',
    'e_min',
    'diff_check_time',
    'interval_time',
    'plan_time_div',
    'use_plantime_flg',
    'time_division',
    'time_set',
    'reason_staff',
    'reason',
    'showed_modal_flg',
  ]

  // 空値のフィールドも省略せず送信する
  fields.forEach((field) => {
    appendValue(params, `data_list[${field}]`, dataList[field])
  })

  console.group('[ATTENDANCE] ajax_attendance POST')
  console.log('dataList:', dataList)
  console.log('entries:', [...params.entries()])
  console.log('body:', params.toString())
  console.groupEnd()

  const response = await fetch(
    `${HUG_BASE_URL}/ajax/ajax_attendance.php`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: params.toString(),
    },
  )

  return parseJsonResponse(response, '退室登録')
}

export const performLeaveAction = async ({
  rId,
  childId,
  facilityId,
  date,
  enterTime,
  leaveTime,
  attendFlg = 4,
  linkage = 0,
  planTimeDiv = '',
  extensionTimePlan = 0,
  changeAttendanceFlg = '',
  hiddenMailOnly = '',
  reasonStaff = '',
  reason = '',
  showedModalFlg = '',
}) => {
  console.group('[ATTENDANCE] performLeaveAction START')

  try {
    if (!rId) throw new Error('r_id がありません')
    if (!childId) throw new Error('c_id がありません')
    if (!facilityId) throw new Error('f_id がありません')
    if (!date) throw new Error('date がありません')

    console.log('[ATTENDANCE] input', {
      rId,
      childId,
      facilityId,
      date,
      enterTime,
      leaveTime,
      attendFlg,
      linkage,
      planTimeDiv,
      extensionTimePlan,
      changeAttendanceFlg,
    })

    // 1. HUG DB上の最新入室時間・提供形態を取得
    let enterInfo = null

    try {
      enterInfo = await getEnterTimeAndProvidingType(rId)
    } catch (error) {
      // HTMLから入室時刻を取得済みならフォールバック可能
      console.warn(
        '[ATTENDANCE] 入室情報取得に失敗。HTML側の値へフォールバックします。',
        error,
      )
    }

    const resolvedEnterTime =
      enterInfo?.entering_room_time ||
      enterInfo?.enter_time ||
      enterTime

    // 呼び出し側で取得した現在時刻を優先。
    // 無い場合のみHUGレスポンスの now_time を使用する。
    const resolvedLeaveTime = leaveTime || enterInfo?.now_time

    if (!resolvedEnterTime) {
      throw new Error('入室時間を取得できませんでした')
    }

    if (!resolvedLeaveTime) {
      throw new Error('退室時間を取得できませんでした')
    }

    const { start, end, diffMinutes, intervalText } = getTimeDiff(
      resolvedEnterTime,
      resolvedLeaveTime,
    )

    const providingType = enterInfo?.providing_type ?? ''

    console.log('[ATTENDANCE] resolved', {
      resolvedEnterTime,
      resolvedLeaveTime,
      providingType,
      diffMinutes,
      intervalText,
    })

    // 2. HUG本体と同じ ajax_extension.php / detail_setting を先に実行
    const extensionResult = await requestExtensionDetail({
      date,
      childId,
      facilityId,
      rId,
      enterTime: resolvedEnterTime,
      leaveTime: resolvedLeaveTime,
      extensionTimePlan,
      changeAttendanceFlg,
    })

    // HUG本体ではここで確認モーダルが入る。
    // 自動でOK扱いせず、呼び出し元へ返す。
    if (extensionResult?.modal_message) {
      console.warn('[ATTENDANCE] 延長支援確認が必要です', extensionResult)

      return {
        success: false,
        cancelled: false,
        requiresExtensionConfirmation: true,
        extensionData: extensionResult,
        error: extensionResult.modal_message,
      }
    }

    // 3. 実ブラウザ通信で確認した25項目を全て送信
    const dataList = {
      date,
      r_id: rId,
      c_id: childId,
      f_id: facilityId,
      hidden_mail_only: hiddenMailOnly ?? '',
      attend_flg: Number(attendFlg ?? 4),
      attendance_type: 2,
      providing_type: providingType ?? '',
      linkage: Number(linkage ?? 0),
      change_attendance_flg: changeAttendanceFlg ?? '',
      enter_time_hi: resolvedEnterTime,
      leave_time_hi: resolvedLeaveTime,
      s_hour: start.hour,
      s_min: start.minute,
      e_hour: end.hour,
      e_min: end.minute,
      diff_check_time: diffMinutes,
      interval_time: intervalText,
      plan_time_div: planTimeDiv ?? '',
      use_plantime_flg: '',
      time_division: '',
      time_set: '',
      reason_staff: reasonStaff ?? '',
      reason: reason ?? '',
      showed_modal_flg: showedModalFlg ?? '',
    }

    // 4. 最終退室保存
    const result = await saveAttendance(dataList)

    console.log('[ATTENDANCE] 退室処理 OK', result)

    return {
      success: true,
      cancelled: false,
      data: result,
      dataList,
      extensionData: extensionResult,
      attendanceItem: result?.attendanceItem ?? result?.attendance_item ?? null,
    }
  } catch (error) {
    console.error('❌ [ATTENDANCE] 退室処理 NG', error)

    return {
      success: false,
      cancelled: false,
      error: error?.message || '退室処理に失敗しました',
    }
  } finally {
    console.groupEnd()
  }
}

export default performLeaveAction
