/**
 * 専門的支援ボタンクリック時の処理。
 * addProfessionalSupportNewTab が Promise / 結果を返す場合は、その結果を呼び出し元へ返す。
 */
export async function handleProfessionalSupportClick({
  addProfessionalSupportNewTab,
}) {
  if (typeof addProfessionalSupportNewTab !== 'function') {
    const result = {
      ok: false,
      error: 'addProfessionalSupportNewTab が設定されていません',
    }

    console.warn('[ProfessionalSupportButton]', result.error)
    return result
  }

  try {
    const result = await addProfessionalSupportNewTab()

    // 既存実装が戻り値を返していない場合も壊さない。
    return result ?? {
      ok: true,
      opened: true,
    }
  } catch (error) {
    const result = {
      ok: false,
      error: error?.message || String(error),
    }

    console.error('[ProfessionalSupportButton] error:', error)
    return result
  }
}
