export function handleProfessionalSupportClick({ addProfessionalSupportNewTab }) {
  if (typeof addProfessionalSupportNewTab !== "function") {
    console.warn(
      "[ProfessionalSupportButton] addProfessionalSupportNewTabが設定されていません",
    )
    return undefined
  }

  return addProfessionalSupportNewTab()
}
