export async function handleLeaveClick({
  onLeave,
  childId,
  childName,
  recordId = '',
  rowSelector = '',
  dateStr,
  mailFlg = 0,
}) {
  if (typeof onLeave !== 'function') {
    console.warn('[LeaveButton] onLeaveが設定されていません')
    return undefined
  }

  try {
    const normalizedMailFlg = Number(mailFlg) === 1 ? 1 : 0
    const payload = {
      recordId,
      r_id: recordId,
      rowSelector,
      mailFlg: normalizedMailFlg,
      mail_flg: normalizedMailFlg,
      rendererMailResolved: true,
    }

    console.log('[LeaveButton] onLeave呼び出し', {
      childId,
      childName,
      dateStr,
      payload,
    })

    const result = await onLeave(payload)

    console.log('[LeaveButton] 退室処理結果', {
      childId,
      childName,
      recordId,
      rowSelector,
      mailFlg: normalizedMailFlg,
      result,
    })

    return result
  } catch (error) {
    console.error('[LeaveButton] 退室処理に失敗しました', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      mailFlg,
      error,
    })
    return { success: false, error: error?.message || String(error) }
  }
}
