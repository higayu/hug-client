export async function handleEnterClick({
  onEnter,
  childId,
  childName,
  dateStr,
  mailFlg = null,
}) {
  if (typeof onEnter !== 'function') {
    console.warn('[EnterButton] onEnterが設定されていません')
    return undefined
  }

  try {
    console.log('[EnterButton] HUG本体の入室onclick実行開始:', {
      childId,
      childName,
      dateStr,
      mailFlg,
    })

    const result = await onEnter({
      nativeOnclick: true,
      mailFlg,
      mail_flg: mailFlg,
      skipMailPrompt: mailFlg === 0 || mailFlg === 1,
    })

    console.log('[EnterButton] HUG本体の入室onclick実行結果:', {
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
      mailFlg,
      error,
    })
    return undefined
  }
}
