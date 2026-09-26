export async function handleLeaveClick({
  onLeave,
  childId,
  childName,
  dateStr,
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
    })

    const result = await onLeave({
      nativeOnclick: true,
    })

    console.log('[LeaveButton] HUG本体の退室onclick実行結果:', {
      childId,
      childName,
      dateStr,
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
