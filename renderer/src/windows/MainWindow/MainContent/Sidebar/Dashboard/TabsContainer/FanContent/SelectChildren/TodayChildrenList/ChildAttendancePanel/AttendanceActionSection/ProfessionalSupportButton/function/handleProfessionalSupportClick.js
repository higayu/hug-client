/**
 * 専門的支援ボタンクリック時の処理
 */
export function handleProfessionalSupportClick({
  addProfessionalSupportNewTab,
}) {
  if (typeof addProfessionalSupportNewTab !== 'function') {
    console.warn(
      '[ProfessionalSupportButton] addProfessionalSupportNewTab が設定されていません',
    )
    return
  }

  addProfessionalSupportNewTab()
}
