export async function handleEnterClick({
  onEnter,
  childId,
  childName,
  recordId = '',
  rowSelector = '',
  dateStr,
}) {
  if (typeof onEnter !== 'function') {
    console.warn('[EnterButton] onEnterが設定されていません')
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

    console.log('[EnterButton] onEnter呼び出し（DOM click方式）', {
      childId,
      childName,
      dateStr,
      payload,
    })

    const result = await onEnter(payload)

    console.log('[EnterButton] HUG入室ボタン click 実行結果', {
      childId,
      childName,
      recordId,
      rowSelector,
      result,
      mailDialogDetected: Boolean(result?.mailDialog?.detected || result?.mailDialogResult?.detected),
    })

    return result
  } catch (error) {
    console.error('[EnterButton] 入室DOM click処理に失敗しました', {
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
