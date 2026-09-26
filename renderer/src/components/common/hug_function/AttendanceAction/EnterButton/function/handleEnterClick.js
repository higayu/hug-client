export async function handleEnterClick({
  onEnter,
  childId,
  childName,
  dateStr,
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
    })

    const result = await onEnter({
      nativeOnclick: true,
    })

    console.log('[EnterButton] HUG本体の入室onclick実行結果:', {
      childId,
      childName,
      dateStr,
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
