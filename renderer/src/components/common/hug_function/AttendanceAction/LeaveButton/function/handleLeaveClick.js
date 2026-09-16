export async function handleLeaveClick({
  onLeave,
  childId,
  childName,
  dateStr,
  mailFlg = 0,
}) {
  if (typeof onLeave !== 'function') {
    console.warn('[LeaveButton] onLeaveが設定されていません')
    return undefined
  }

  try {
    console.log('[LeaveButton] 退室処理開始:', {
      childId,
      childName,
      dateStr,
      mailFlg,
    })

    const result = await onLeave({
      mailFlg,
      mail_flg: mailFlg,
      skipMailPrompt: true,
    })

    console.log('[LeaveButton] 退室処理完了:', {
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
      error,
    })
    return undefined
  }
}
