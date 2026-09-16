export async function handleEnterClick({
  onEnter,
  childId,
  childName,
  dateStr,
  mailFlg = 0,
}) {
  if (typeof onEnter !== 'function') {
    console.warn('[EnterButton] onEnterが設定されていません')
    return undefined
  }

  try {
    console.log('[EnterButton] 入室処理開始:', {
      childId,
      childName,
      dateStr,
      mailFlg,
    })

    const result = await onEnter({
      mailFlg,
      mail_flg: mailFlg,
      skipMailPrompt: true,
    })

    console.log('[EnterButton] 入室処理完了:', {
      childId,
      childName,
      dateStr,
      mailFlg,
      result,
    })

    return result
  } catch (error) {
    console.error('[EnterButton] 入室処理に失敗しました:', {
      childId,
      childName,
      dateStr,
      error,
    })
    return undefined
  }
}
