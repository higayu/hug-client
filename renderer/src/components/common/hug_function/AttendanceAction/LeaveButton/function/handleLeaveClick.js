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

    void 0

    const result = await onLeave(payload)

    void 0

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
