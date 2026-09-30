export async function handleEnterClick({
  onEnter,
  childId,
  childName,
  recordId = '',
  rowSelector = '',
  dateStr,
  mailFlg = 0,
}) {
  if (typeof onEnter !== 'function') {
    console.warn('[EnterButton] onEnterが設定されていません')
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

    console.log('[EnterButton] onEnter呼び出し', {
      childId,
      childName,
      dateStr,
      payload,
    })

    const result = await onEnter(payload)

    console.log('[EnterButton] 入室処理結果', {
      childId,
      childName,
      recordId,
      rowSelector,
      mailFlg: normalizedMailFlg,
      result,
    })

    return result
  } catch (error) {
    console.error('[EnterButton] 入室処理に失敗しました', {
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
