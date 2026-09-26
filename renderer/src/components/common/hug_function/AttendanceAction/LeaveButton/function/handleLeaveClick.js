export async function handleLeaveClick({
  onLeave,
  childId,
  childName,
  dateStr,
  mailFlg = null,
}) {
  if (typeof onLeave !== 'function') {
    console.warn('[LeaveButton] onLeaveが設定されていません')
    return undefined
  }

  try {
    console.log('[LeaveButton] HUG本体の退室onclick実行開始:', {
      childId,
      childName,
      dateStr,
      mailFlg,
    })

    const result = await onLeave({
      nativeOnclick: true,
      mailFlg,
      mail_flg: mailFlg,
      skipMailPrompt: mailFlg === 0 || mailFlg === 1,
    })

    console.log('[LeaveButton] HUG本体の退室onclick実行結果:', {
      childId,
      childName,
      dateStr,
      mailFlg,
      result,
    })

    return result
  } catch (error) {
    console.error('[LeaveButton] 退室処理に失敗しました:', {
      childId,
      childName,
      dateStr,
      mailFlg,
      error,
    })
    return undefined
  }
}
