export async function handleLeaveClick({
  onLeave,
  childId,
  childName,
  recordId = '',
  rowSelector = '',
  dateStr,
}) {
  if (typeof onLeave !== 'function') {
    console.warn('[LeaveButton] onLeaveが設定されていません')
    return undefined
  }

  try {
    const payload = {
      nativeOnclick: true,
      domClick: true,
      recordId,
      r_id: recordId,
      rowSelector,
    }

    console.log('[LeaveButton] onLeave呼び出し（DOM click方式）', {
      childId,
      childName,
      dateStr,
      payload,
    })

    const result = await onLeave(payload)

    console.log('[LeaveButton] HUG退室ボタン click 実行結果', {
      childId,
      childName,
      recordId,
      rowSelector,
      result,
      mailDialogDetected: Boolean(result?.mailDialog?.detected || result?.mailDialogResult?.detected),
    })

    return result
  } catch (error) {
    console.error('[LeaveButton] 退室DOM click処理に失敗しました', {
      childId,
      childName,
      recordId,
      rowSelector,
      dateStr,
      error,
    })
    return undefined
  }
}
