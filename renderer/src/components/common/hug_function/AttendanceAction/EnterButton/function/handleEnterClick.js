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

    void 0

    const result = await onEnter(payload)

    void 0

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
